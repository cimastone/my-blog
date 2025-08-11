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
Controller leader 将“创建 topic”操作封装为一条元数据日志（record），包括 topic 名、分区数、副本数等

**分配结果数据结构 DEMO**
假设有如下创建 topic 请求：

- topic: demo-topic
- partition 数: 3
- 副本数: 2
- 集群 broker: broker-1（nodeId=1）, broker-2（nodeId=2）, broker-3（nodeId=3）
  
分配结果示例：
```json
{
  "topic": "demo-topic",
  "partitions": [
    {
      "partition": 0,
      "leader": 1,
      "replicas": [1, 2],
      "isr": [1, 2]
    },
    {
      "partition": 1,
      "leader": 2,
      "replicas": [2, 3],
      "isr": [2, 3]
    },
    {
      "partition": 2,
      "leader": 3,
      "replicas": [3, 1],
      "isr": [3, 1]
    }
  ]
}
```
- leader：该 partition 的 leader broker（负责读写）。
- replicas：所有副本 broker。
- isr：初始时等于 replicas（都在同步状态）。

2. **KRaft 模式下的同步流程**
在 KRaft（Kafka Raft）模式下，不再依赖 ZooKeeper，Controller 角色通过内置 Raft 共识日志同步元数据，流程如下：
  - Controller 选举：全体 broker 选出一个 active controller
  - 创建 topic 请求到达 Controller。
  - Controller 生成分配方案（示例如上），并将操作（如 topic 创建、分区分配）写入 KRaft 内置的元数据日志（__cluster_metadata topic）。这个内置的topic是单一partition；也会有ISR
  - Raft 协议保证该元数据变更在大多数 controller 节点上复制并 commit
    - controller节点数小于等于broker节点数
    - raft的commit是隐式commit，也是分为两阶段：**区别于zab 原子广播，zab的第二阶段是显示的发起commit消息，推进zxid；而raft是隐式的同步commitIndex，减少网络开销**
       - 第一阶段： controller leader在本地写入Raft日志后（pagecache），将元数据主动推给controller follow，待接收到超过半数follow的ack则推进leader commitIndex，ack给producer
       - 第二阶段：通过心跳机制或appendEntry消息将leader推进的commitIndex同步至controller follower，当然分为两种模式：Pull/apply交互
         - Raft follower的同步一般是“被动拉+主动推”结合：
           - 正常情况下Leader主动推送最新条目（AppendEntries RPC）。
           - Follower如果有落后，可以主动pull（通过RequestVote/InstallSnapshot/拉日志）。
         - Follower apply动作：
           - Follower节点会把commitIndex之前的所有条目“apply”到本地状态机（即更新自己的元数据快照）。
           - 这样所有controller节点的状态都是一致的。
    
  - Kafka 创建 topic 的 ack 返回方式
    - 当元数据写入 KRaft 日志并 commit，且 controller 做完分配后，才向请求 client 返回“成功”ack。
    - 只有此时，所有 broker 都可感知到新 topic/partition/leader 的信息，Producer 才能继续后续生产消息。
    - 若 commit 失败/超时，则 client 收到异常（如 NOT_CONTROLLER、TIMEOUT 等）。
    
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

## 二、producer发送消息全流程

### 数据副本同步流程（partition消息副本同步）

1. Producer写消息到partition leader的流程
   - Producer发送消息到partition leader。
   - partition leader先写入本地磁盘文件（通常进入page cache）。
   - leader收到写入成功，并不会立即ack producer，而是等待ISR（in-sync replicas）全部副本同步。
2. Follower拉取数据的流程
   - partition follower通过ReplicaFetcher线程主动向leader拉取新数据（拉取的是文件内容，通常能直接从leader的page cache读取）。
   - follower拉取到数据后，写入自己的本地磁盘（page cache）。
3. Follower如何ack给leader？
   - follower拉取并写入成功后，会向leader发送fetch response，包含“我已经同步到哪个offset”的信息。
   - leader根据所有ISR follower的同步进度，计算“已同步到ISR所有副本的最大offset”（即high watermark）。
4. Leader什么时候ack producer？
   - 只有当本条消息被所有ISR副本（包括leader自己）都同步到，且follower ack了leader，leader才认为这条消息“已复制到ISR全部副本”。
   - 此时leader提升high watermark，并ack producer，告知消息已安全写入。
  
### 流程时序图
```bash
Producer
   |
   | Send message
   v
Partition Leader
   |--> 写入本地磁盘（page cache）
   |--> 等待ISR follower拉取
   |    |
   |    |<-- Follower 拉取新数据
   |    |    |--> follower写入本地磁盘
   |    |    |--> follower ack/fetch response
   |    |---> (leader收到follower ack)
   |
   | 当所有ISR follower都ack后
   |--> leader提升high watermark
   |--> ack producer
```

### 要点总结

- Producer写入partition leader后，不会立刻被ack，而是等ISR所有副本都同步到这条消息（ack = all场景）
- follower拉取（pull）数据，拉完后通过fetch response ack给leader
- leader收到ISR全部follower确认后，才ack producer

### 关键术语说明
- High watermark：leader已知被ISR全部副本同步的最大offset，只有高水位以下的数据才对消费者可见。
- ISR（in-sync replicas）：当前活跃、且与leader同步进度在一定范围内的副本集合。

### 补充细节
- 如果Producer设置acks=1，只要leader写入本地就ack producer，不等ISR follower同步。
- 如果acks=all（推荐生产环境），才是上述严格流程。


## 三、producer发送消息batch record
> Producer发送给Broker的数据总是以batch（批量）为单位，即使只有一条消息，也会被封装成一个batch。
> 是否压缩，取决于Producer端的compression.type配置（如gzip、snappy、lz4、zstd等）。
>  - 压缩发生在Producer端，批量内的消息组织好后统一压缩成一个数据块，发给Broker。
> 默认情况：如果没有配置压缩，则batch未压缩直接发送；如果配置了压缩，则所有消息batch压缩后发送。
> Broker收到的就是batch结构，内容可能是压缩过的，也可能是未压缩的，完全取决于Producer端配置。

Kafka的“线性写入”主要指的是顺序批量写入（append-only），与是否压缩没有直接关系。
- 核心在于batch（批量）和顺序写：
 - Producer总是以batch（无论有没有压缩）发送数据，Broker收到后顺序写入磁盘segment文件（通常写入OS page cache）。
 - 只要是批量、顺序append，写入就是线性的。
- 压缩的好处在于：减少I/O量、提升带宽利用率、降低存储空间，但不影响顺序线性写入的特性。
- 如果Producer不开启压缩，Kafka依然可以顺序、批量地线性写入segment文件（page cache）。

Record Batch结构简述
- Record batch是Kafka日志的基本写入单元，一批连续的消息（records）被组织成一个batch。
- batch包括：batch头（包含magic、offset、长度、压缩算法、事务信息等）和消息体。
- 一个batch里的消息是同一个producer一次发送/flush的。


## 四、producer事务

Kafka事务本质：确保一组消息（可能跨多个topic/partition）要么全部可见、要么全部不可见，提供“原子性写入”。
典型场景：用于“精确一次(Exactly Once)语义”，比如流式计算（Flink、Spark Streaming）、双写等，避免数据丢失或重复。
实现方式：Producer端分配一个事务ID，开启事务、写入多条消息、最后commit或abort。未commit的数据对消费者不可见。

跨分区/多topic事务时，Producer在事务内可以向任意多个分区、多个topic发送消息。
这些消息实际是分散写入不同的partition的batch record内，每个partition独立存储自己的record batch。

一个RecordBatch只属于一个事务（或者根本不是事务消息），即每个batch头部只会携带一个事务ID（如果是事务消息）。

- Producer在事务内构造batch时，每个batch的头部会包含该事务的ID、producer epoch、sequence number等；
- 不会出现一个batch内混杂多个事务ID的消息。
- 非事务消息的batch，事务ID字段为空或特殊标记。

Producer端事务ID的提交是有严格顺序的，不能乱序提交。
 - 每个事务ID配合producer epoch和sequence number，Kafka强制要求producer必须顺序地commit事务。
 - 如果有前面的事务未commit/abort，后面的事务commit会被判定为非法，Kafka会拒绝或抛出异常。
 - 设计原因：防止乱序带来的数据可见性混乱，保持offset和事务的严格顺序一致性。

消息顺序
- 消息1：带事务A
- 消息2：无事务
- 消息3：带事务B
- 消息4：无事务
- 消息5：带事务A
  
RecordBatch切分原则简述

- 事务属性（有/无事务、事务ID）不同一定会切batch。
- 事务ID不同一定切batch。
- 事务/非事务消息不会合在一个batch里。
- 同一事务、同一分区、同一producer epoch下才可以合批。
  
本例切分情况
假设Producer没有特殊的batch size或flush触发（以事务属性为主），如下：

| 消息序号 | 事务属性 | 分配到的Batch |
| :---: | :---: | :---: |
| 1 | 事务A | Batch 1（事务A） | 
| 2 | 无事务 | Batch 2（无事务） |
| 3 | 事务B | Batch 3（事务B） |
| 4 | 无事务 | Batch 4（无事务） |
| 5 | 事务A | Batch 5（事务A） |

结果：

- Batch 1：消息1（事务A）
- Batch 2：消息2（无事务）
- Batch 3：消息3（事务B）
- Batch 4：消息4（无事务）
- Batch 5：消息5（事务A）
  
原因：

- 每次事务ID变化，或者从事务→非事务、非事务→事务，都会切batch。
- 哪怕是同一事务A，消息1和消息5也会因为中间插入了其他类型消息而分成不同batch（Kafka Producer端不会自动把相隔的同事务消息合到一个batch里）。
  
发送顺序
- Producer端的发送顺序就是消息产生顺序（1→2→3→4→5），
- 每个batch会依序请求到broker，broker会按batch顺序append到partition log。

hwm的定义与consumer可读性
- hwm（high watermark）：ISR（Leader和所有同步副本）已同步的最大offset。它只表示“数据的持久化安全性及可读下限”。
- consumer是否可读（read_committed模式下）=
 - offset ≤ hwm
 - 并且该offset对应的消息如果是事务消息，则事务已commit（且commit marker也在hwm以内）

关键特征
- 事务消息在写入时，消费者（读已提交）不可见，只有commit后才暴露。
- 支持原子写入多个分区（甚至多个topic）。
- 保证Exactly Once语义（EOI/EOS）。

场景1：流式ETL或双写
- 消费topicA数据，写入topicB和topicC，需要保证要么两边都写入成功，要么都不写，避免“部分写入”导致数据不一致。
 - begin_transaction()
 - 写topicB
 - 写topicC
 - commit_transaction()

Consumer消费topicA → 应用处理 → Producer用事务写入topicB和topicC。
Kafka事务机制负责确保写入topicB、topicC的消息原子可见，但消费topicA和写入topicB/C是由你的应用/框架来调度、驱动的，不是broker自己自动完成的。


事务消息的写入流程
 - Producer开启事务initTransactions()，得到事务ID。
 - beginTransaction()后，Producer批量发送消息到多个partition。
 - 发送完成后，commitTransaction()或abortTransaction()。
 - 只有commit后，这批消息才对consumer（read_committed模式）可见。
 - 如果abort，则这批消息会被Kafka标记为无效，消费者不会读到。

问题1:
副本broker也包含leader节点是么？这条元数据也会更新至pagecache么？

是的，partition的leader其实也是副本(replica)的一种，只不过是ISR中的那个“主”副本。
比如 Partition-0 副本分布是[broker-1, broker-2, broker-3]，其中 broker-2 既是副本也是leader。
Kafka所有broker（无论是leader还是follower）都维护partition元数据，包括每个partition的leader是谁、ISR有哪些。
这些元数据会被加载到内存（通常还有pagecache），以便快速路由和管理。
生产环境下元数据变更非常快，但数据量较小，通常都在内存和pagecache中有缓存。



问题2:
  元数据日志也是一个内部的topic，持久化操作和正常消息一样？有partition和ISR吗？

  KRaft模式下的元数据日志确实是一个特殊的内部topic，叫__cluster_metadata。
这个topic记录了集群的所有元数据变更（如topic创建、分区分配、ACL修改等）。
这个内部topic只会有一个partition（单分区），因为Raft协议要求全序。
它也有ISR机制：
Raft管理的controller节点（通常是一组broker）都维护该partition的副本。
只有ISR内的节点（即Raft quorum中的follower）才能参与commit。
持久化方式和普通消息类似（顺序写入log segment），但协议和一致性保证更严格，commit依赖Raft日志复制与提交。

问题3:
KRaft的commit机制：commitIndex同步与隐式提交

KRaft（Raft协议）里的commit动作是隐式的，不需要显式“commit”命令。
Controller Leader接收到如“创建topic”等变更请求后，将日志条目（如topic创建元数据）写入自身的Raft日志。
然后同步给其他controller节点（Raft follower）。
一旦有超过半数follower副本ack该日志条目，controller leader就将该条目的commitIndex向前推进，并认为该操作已被集群大多数节点持久化。
新的创建topic或心跳（AppendEntries）会带上最新的commitIndex，follower据此apply到本地状态机。
这正是Raft的核心一致性保障机制。

问题4:
controller节点元数据同步、commitIndex管理及pull/apply流程

4.1 元数据同步流程
Controller Leader在本地写入Raft日志后，主动将日志条目（元数据变更）“AppendEntries”推送给follower（即其它controller节点）。
Follower收到后写入本地Raft日志，并ack给Leader。
Leader收到超过半数controller节点ack后，将该条目标记为commit（推进commitIndex）。
4.2 Pull/apply交互
Raft follower的同步一般是“被动拉+主动推”结合：
正常情况下Leader主动推送最新条目（AppendEntries RPC）。
Follower如果有落后，可以主动pull（通过RequestVote/InstallSnapshot/拉日志）。
Follower apply动作：
Follower节点会把commitIndex之前的所有条目“apply”到本地状态机（即更新自己的元数据快照）。
这样所有controller节点的状态都是一致的。
4.3 ack时机
只有当大多数controller节点（Raft quorum）同步并commit了该元数据变更，Leader才会返回ack给Producer/AdminClient。
确保“创建topic”这种操作不会因单点故障导致脑裂。
4.4 所有broker的元数据同步？
只有Controller集群（通常3/5个broker）需要强一致commit。
所有broker（不只是controller）都会“订阅”元数据日志，拿到最新的元数据视图用于自身数据调度和服务Producer/Consumer请求。
但只要Controller的Raft quorum“已commit”，就可以认为变更已生效并ack客户端。
普通broker的同步是最终一致，不影响创建topic等操作的提交。


问题5:
“超过半数”是指Raft Controller节点的多数，而不是ISR中所有follower

在KRaft（Raft协议）下，commit的判定标准是超过半数（majority/quorum）controller节点已经写入了日志条目（即ack了日志）。
假如有N个controller节点，只要有 ⌊N/2⌋+1 个节点持久化该条目，即可推进commitIndex。
这与“ISR的所有follower”不是一回事。ISR（In-Sync Replicas）是针对partition数据副本同步，Raft Quorum是针对元数据日志的共识。
举例：5个controller节点，3个节点写入即算commit，哪怕有2个落后也不影响“已commit”状态。


问题6:
与zab是不是一样，只要超过半数节点持久化了，哪怕此时leader down机，leader未收到超半数follow ack，未ack给producer，未推进commitIndex，未通过心跳同步commitIndex至follow，这条数据都不会丢失

问题7:
controller/follower的两阶段与普通broker的同步机制

普通broker节点（非controller）的数据获取与同步

被动接收： controller-leader会主动推送最新的元数据信息（如PartitionMetadata、TopicMetadata等）给所有broker。
启动时/重连时： broker节点启动或与controller重连后，会主动拉取一份完整的元数据快照。
日常运行时： broker收到controller推送的元数据增量更新。
broker之间不会互相同步元数据，只和controller通信。

普通broker只会被动接收controller leader推送的元数据消息。
这些推送是controller leader在raft commit完成后额外构造并发送的专门消息，不是raft日志同步过程的“副产品”。
普通broker完全不参与controller集群的raft日志同步过程。

消息流转路线
controller leader写入raft日志 → raft commit → controller leader应用变更 → 主动推送元数据到所有broker（包括自己）

问题8:
producer创建完topic，收到controller leader ack后，请求任意broker获取topic元数据时，能否拿到最新元数据？

正常情况下： 向任意broker请求topic元数据时，broker会返回它本地已知的最新元数据。

极端情况下：

由于元数据是controller推送到broker，存在网络延迟或者推送尚未完成的情况。
这意味着：请求到的broker可能还没收到最新的元数据，返回的可能是“旧数据”。
这种情况在刚创建topic、刚变更分区、刚迁移leader等操作后更容易发生。
KRaft下的设计初衷：

controller推送是异步的，不能保证所有broker元数据总是100%一致。
客户端SDK通常会自动重试/刷新元数据，或者当发现topic不存在后重新请求metadata。
Kafka官方文档明确提到，元数据一致性是“最终一致性”，而不是强一致性。
在极端情况下（比如新topic刚创建），部分broker短时间内可能查不到topic元数据。

问题9:
事务commit与KRaft元数据commit的区别
Kafka事务commit（数据层面）：Producer提交事务，写入commit/abort marker，控制partition内消息的可见性。
KRaft commit（元数据Raft层面）：集群控制器节点（Controller）用Raft协议管理元数据日志，commit是Raft日志复制的术语，和partition数据日志、hwm推进机制是两回事。
两者没有直接关联，是不同层次、不同作用的commit概念！
