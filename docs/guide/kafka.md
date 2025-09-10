---
title: "kafka - 简介"
date: 2025-08-26
author: cimaStone
category: "技术架构/kafka"
tags: 
  - kafka
---

# kafka - producer

## 🎯 背景
   该篇文章主要是对kafka的简单介绍

---

## 一、Kafka的核心概念

- Producer（生产者）：发送消息到Kafka集群的客户端应用。
- Broker：Kafka集群中的一个节点，负责消息的接收、存储和分发。
- Topic（主题）：消息的分类/类别，生产者将消息发送到特定的topic，消费者从topic中读取消息。
- Partition（分区）：每个topic可以被分成多个partition，提升并发和容错能力。
- Group Coordinator：是Broker上的服务角色，负责维护group成员、分区分配、offset存储
- Offset：消息在partition中的唯一编号，消费者根据offset读取消息。
- Consumer（消费者）：从Kafka集群拉取消息的客户端应用。

## 二、Kafka的典型应用场景：

- 日志收集与分析
- 实时监控和告警
- 流式数据处理
- 消息队列（解耦微服务）

## 三、Kafka的基本工作流程：

- Producer将消息发送到指定topic。
- Broker接收消息并存储在topic的partition中。
- Consumer订阅topic，从对应的partition中拉取消息进行处理。

## 四、Kafka的优势：

- 高吞吐量：支持大规模消息处理。
- 可扩展性：支持集群扩展。
- 持久化：数据持久化到磁盘，支持容错。
- 分布式：天然支持分布式部署。

在 KRaft（Kafka Raft Metadata mode）下，Kafka 不再依赖 ZooKeeper，所有元数据由 Kafka 集群自身管理。KRaft 采用了 Raft 共识协议，确保元数据的一致性和高可用性。
