---
title: "kafka - broker"
date: 2025-07-23
author: cimaStone
category: "技术架构/kafka"
tags: 
  - broker
  - kafka
---

# kafka - broker

## 🎯 背景
   该篇文章主要讲述的是broker内部相关的设计，如：controller、replication、HWX等

## 一、Kafka文件系统

Kafka 文件系统缓存机制优势

1. 利用操作系统的文件系统页缓存而非自建内存缓存
- Kafka并不把大量消息缓存在JVM堆内或自己实现的缓存结构，而是直接把数据写入磁盘文件（segment）。
- 读写消息时充分利用操作系统的page cache（文件系统缓存），让操作系统自动管理数据的冷热，减少内存占用和GC压力。

2. 缓存的是数据字节序列（byte array），而非对象
- Kafka存储的数据是连续的二进制字节流（byte buffer），写入磁盘也是二进制格式。
- 页缓存缓存的是原始的数据块，而不是反序列化后的数据对象，减少了JVM对象数量，降低了GC和内存碎片风险，提升了缓存命中效率。

3. 缓存热数据可跨服务重启保持
- 文件系统的页缓存由操作系统统一管理，Kafka服务重启时，操作系统的缓存不会被清空（只要机器不重启）。
- 相比进程内缓存（JVM内存），重启后缓存命中率高，无需重建缓存，极大提升了重启后的“冷启动”性能。


borker对压缩的数据进行解压的场景：
如果Consumer只请求batch中的部分消息（比如设置了maxBytes、maxMessages、或做了过滤），Broker需要知道哪些消息属于哪个offset，需要先解压获取消息边界；
事务、过滤等场景下，Broker也必须解压才能正确处理请求。

如果Broker解压了：
通常Broker还是会把需要返回的消息重新按batch压缩后发给Consumer（否则一批Consumer拿到的格式不一致，效率低），但这时压缩粒度可能不等于原始Producer batch。
只有在特殊配置/协议下，Broker才会直接发原始未压缩消息给Consumer，这不是主流用法。

Kafka log segment文件（即数据落盘）存储的是record batch，每个batch可以是压缩的，也可以是不压缩的。
- Producer端决定是否压缩（取决于producer的compression.type配置）。
- Broker收到的batch直接写入日志（segment），不会主动重新压缩或解压。
- 这样，一个partition的log文件里，可以混合存在压缩和未压缩的record batch。


Kafka是批量顺序写，顺序写极大提高了写入效率。

- 核心点： Producer端批量发送，Broker端批量append，所有数据以batch为单位顺序追加到segment文件。
- 顺序写的好处：
 - 顺序写磁盘速度远高于随机写（机械盘尤其明显，SSD也有提升）。
 - 操作系统page cache、文件系统优化、磁盘预读等都能充分利用顺序写的线性I/O特性。
 - Kafka通过顺序写，把高并发小消息合并为大块线性写，极大提升吞吐和降低延迟。
- 不是“部分顺序、部分随机”，而是尽量全程顺序写**，只有极端异常（如crash recovery、log compaction等）会有少量随机I/O。
