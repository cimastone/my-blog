---
title: "kafka - producer"
date: 2025-07-23
author: cimaStone
category: "技术架构/kafka"
tags: 
  - producer
  - kafka
---

# kafka - producer

## 🎯 背景
   该篇文章主要讲述的是producer发送消息给到broker ——> broker的完整流程；里面可能也涉及到kafa server的相关设计

---

## 一、Kafka的核心概念

- Producer（生产者）：发送消息到Kafka集群的客户端应用。
- Consumer（消费者）：从Kafka集群拉取消息的客户端应用。
- Broker：Kafka集群中的一个节点，负责消息的接收、存储和分发。
- Topic（主题）：消息的分类/类别，生产者将消息发送到特定的topic，消费者从topic中读取消息。
- Partition（分区）：每个topic可以被分成多个partition，提升并发和容错能力。
- Offset：消息在partition中的唯一编号，消费者根据offset读取消息。

Kafka的典型应用场景：

- 日志收集与分析
- 实时监控和告警
- 流式数据处理
- 消息队列（解耦微服务）

Kafka的基本工作流程：

- Producer将消息发送到指定topic。
- Broker接收消息并存储在topic的partition中。
- Consumer订阅topic，从对应的partition中拉取消息进行处理。
  
Kafka的优势：

- 高吞吐量：支持大规模消息处理。
- 可扩展性：支持集群扩展。
- 持久化：数据持久化到磁盘，支持容错。
- 分布式：天然支持分布式部署。

在 KRaft（Kafka Raft Metadata mode）下，Kafka 不再依赖 ZooKeeper，所有元数据由 Kafka 集群自身管理。KRaft 采用了 Raft 共识协议，确保元数据的一致性和高可用性。

### 1.1 元数据的内容
Kafka 的元数据包括但不限于：
- 集群配置信息（Cluster config）
- Topic 列表及其分区（Topic & Partition）
- 分区副本分配（Replica assignment）
- 控制器选举状态（Controller election）
- ACL（访问控制列表）
- Producer/Consumer 的协调状态
- 事务状态

所有这些信息都写入 KRaft 的元数据日志（metadata log），由集群内的 controller quorum（控制器法定节点）管理。

---

### 2. 主要角色

#### 2.1 Controller（控制器）
- 定义：在 KRaft 模式下，Controller 不再是单节点，而是以 Raft 协议组成的一个控制器 quorum（通常为3、5或7个节点）。
- 职责：
  - 负责所有元数据的读写和一致性维护（如 Topic 创建、分区扩容、副本分配）。
  - 负责 leader 选举、集群状态监控、节点上下线检测。
  - 唯一能写入和提交元数据变更的是 Raft quorum 的 Leader。
  - 通过 Raft 日志复制保证所有 controller 节点的数据一致。
 
#### 2.2 Broker（代理/服务端节点）
- 定义：Broker 是实际存储和转发消息的节点。
- 职责：
  - 存储用户的消息数据（log segment）。
  - 每个 broker 通过订阅 controller quorum 的元数据日志，保持自己的元数据副本最新。
  - 作为分区副本（leader 或 follower）参与分区副本同步。
  - Broker 节点可以同时作为 controller quorum 的成员，也可以只作为普通数据节点。

#### 2.3 Partition（分区）
- 定义：每个 topic 被划分为若干 partition，partition 是 Kafka 的并发和高可用单位。
- 职责：
  - 每个 partition 有多个副本（replica），分布在不同的 broker 上。
  - 分区的 leader 负责处理 client 的读写请求，follower 负责同步 leader 的数据。
  - partition 的分配、leader/follower 状态等元数据由 controller 管理并广播。
 
### 3. 元数据的处理流程

#### 3.1 元数据写入流程（如创建 topic）
1. 客户端请求（如创建 topic）发送到任一 controller quorum 成员。
2. 如果该节点不是 leader，会将请求重定向到 quorum leader。
3. Leader 生成元数据变更日志（如新 topic、partition、replica assignment）。
4. 元数据日志通过 Raft 复制到所有 controller 成员（大多数提交后生效）。
5. 志，更新本地元数据缓存。
6. Broker 根据最新元数据进行分区创建、分配副本、调整 leader/follower 等操作。

#### 3.2 元数据读取流程

- 任何 broker 都可以为 client 提供元数据查询服务（如 topic/partition 列表）。
- Broker 本地缓存的元数据通过订阅 controller quorum 的元数据日志定期更新，确保一致性。

### 4. Controller、Broker、Partition 的互动

- Controller quorum 作为唯一的元数据“权威”，所有变更都必须通过它们提交。
- Broker 仅作为元数据的“消费者”与“执行者”，不会主动修改元数据，只能根据 controller 的指令操作实际分区或副本。
- Partition 的 leader/follower 状态、分布、ISR（in-sync replicas）等都由 controller 统一调度和维护。


## 二、创建topic全流程

### 1. 创建 Topic 请求的流转

#### 1.1 Producer 请求到 Controller 非 Leader 节点

- Producer 或管理员客户端（如 kafka-topics.sh）向任意 Controller 节点发起“创建 topic”请求。
- 这个 broker 会检测到自己不是当前的 Controller Leader，直接返回 NOT_CONTROLLER 错误给客户端。
- 客户端（如 kafka-topics.sh、AdminClient）收到这个错误后，会自动刷新元数据、发现新的 Controller Leader，然后后续的相关请求会直接发给新的 Controller Leader。
  
#### 1.2 Controller Leader 处理流程
1. **生成元数据变更记录**
Controller leader 将“创建 topic”操作封装为一条元数据日志（record），包括 topic 名、分区数、副本数等。

2. **Raft 日志复制**
  - 这条日志被追加到 controller quorum 的本地 Raft 日志中。
  - leader 通过 Raft 协议把日志同步到其他 controller 节点。
  - 一旦大多数节点持久化该 entry，leader 将其 commit（推进 commitIndex），并应用到本地元数据存储。
    
3. **返回 Producer**
leader commit 后，即可向 producer/client 返回“创建成功”响应。

### 2. Partition 分配和副本分布

#### 2.1 分区分配策略

- Controller leader 根据 topic 的分区数和副本因子，为每个 partition 挑选一组 broker 作为副本节点。
- 默认采用“轮询+均衡”的分布式分配算法（Round Robin、Rack Awareness等），避免热点和单点。
  
例如：

- 创建 topic foo，3 分区，2 副本，集群有 broker 1/2/3。
- 可能的分配结果：
  - partition 0: broker 1, broker 2
  - partition 1: broker 2, broker 3
  - partition 2: broker 3, broker 1
    
#### 2.2 Partition Leader 选择

- 默认每个 partition 的第一个副本节点为 leader。
- controller leader 在分配时指定每个 partition 的 leader（通常是该 partition 的副本列表第一个 broker）。

### 3. Partition 副本同步机制

#### 3.1 元数据下发

- 所有 broker 监听 controller quorum 的元数据日志更新。
- 一旦 topic 创建并 commit，所有 broker 会收到最新的 topic/partition/replica 分配信息。
  
#### 3.2 副本创建与分区本地初始化

- 被指定为某 partition 副本的 broker，会在本地初始化对应的 log 目录和元数据。
- partition leader broker 会成为该分区的“主”，接收 client 的 produce/consume 请求。
  
#### 3.3 副本同步流程

- partition leader 负责同步数据到 follower 副本。
- follower 通过 Fetch 请求从 leader 拉取数据。
- Kafka 通过 ISR（In-Sync Replicas）机制，监控各副本同步进度。
- 只有 ISR 内的副本才被认为“活跃”，写入成功必须被所有 ISR 副本确认。

```bash
Producer -> 任意 Controller -> Controller Leader
    |        (转发/重定向)         |
    |---------------------------->| 创建 topic request
    |<- 返回成功响应（commit后）   |
    |
Controller Leader:
    - 生成元数据变更（分区/副本分配）
    - Raft 日志复制并 commit
    - 本地元数据 apply
    - 向所有 broker 广播最新 metadata

Broker:
    - 收到新 topic/partition 分配
    - 各自初始化 partition 副本
    - leader broker 负责写入/同步
    - follower broker 通过 Fetch 拉取
    - ISR 机制保证副本强一致
```
