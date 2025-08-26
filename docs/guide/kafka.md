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
