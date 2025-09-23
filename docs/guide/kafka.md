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

### kafka 使用fileSystem

Kafka 的消息写入采用文件系统存储，并充分利用操作系统的 page cache 机制，实现高效写入与内存管理。每条消息在写入时会序列化为字节数组并通过 FileChannel 直接写入磁盘 segment 文件，操作系统会自动将这些数据缓存在 page cache 中，而非占用 JVM heap。
  1. 降低 JVM 内存压力，避免频繁 GC 和内存复制；
  2. 提升读写性能，通过 page cache 实现高效顺序写和高速读，避免频繁磁盘 I/O。
  3. 提高 Broker 宕机恢复速度，因热数据仍可能保留在 page cache 中；
  4. 写入流程的解耦与优化。

现在对这几个好处进行展开阐述
**降低 JVM 内存压力，避免频繁 GC 和内存复制** 
1. Kafka 消息写入是立即序列化为字节数组（byte[]），然后写入磁盘文件（Segment file），使用 Java 的 FileChannel.write(ByteBuffer)。
2. 这一步不是“先存内存再 flush”，而是直接将 byte 写入 FileChannel，操作系统会自动将其缓存到 page cache，等合适的时机（fsync、flush）写入磁盘。
3. kafka消息不会长期把消息存放在java heap，做到数据校验处理之后，在directBuffer中开辟空间进行写入，并序列化为字节数组，copy至pagecache；这样在一定程度上降低消息体在java heap存活的时间，避免了
   - GC 扫描大量对象；
   - 内存溢出风险；
   - 内存复制 / 老年代 promotion 等性能问题。
这点是 Kafka 性能高、稳定的重要原因之一。

```bash
[ 客户端 socket 数据 ]
        ↓
[ Kafka NIO线程接收 → 反序列化 → 校验压缩等处理 ]
        ↓
[ JVM Heap 中的 byte[] ]
        ↓  (复制)
[ DirectByteBuffer (堆外内存) ]
        ↓
[ FileChannel.write() → OS page cache ]
        ↓
[ Kafka flush 策略 → fsync → 磁盘文件（segment） ]

```




**Broker 宕机后热数据仍保留，提升恢复效率** 
1. Kafka Broker 宕机后，操作系统的 page cache 仍然可能存活（只要机器没重启）。
2. Broker 重启后，读取仍然可以命中 page cache，避免反复从磁盘加载，这对恢复时间和读性能都有提升。

**写入流程的解耦与优化** 
1. JVM 层完成 network + 序列化；
2. OS 完成 file write；
3. 实际刷盘（flush to disk）由 OS / Kafka 的 flush 策略控制
4. 对于读操作，Kafka 优先从 page cache 命中，减少物理磁盘 IO。

Kafka 提供两种重要配置项，用于控制 是否/何时 flush 到磁盘：
1. log.flush.interval.messages
  - 含义：每写入多少条消息后，主动 flush 一次（调用 fsync）
  - 默认：Long.MAX_VALUE（极大值），意味着不主动刷盘，只靠 OS 决定什么时候 flush
    
2. log.flush.interval.ms
  - 含义：每隔多长时间 flush 一次（即周期性地 fsync）
  - 默认也是非常大，意味着尽量不打扰 IO 流程

3. unclean.leader.election.enable（间接相关）
  - 如果 ISR 中 Follower 落后太多会被踢出，那么刷盘延迟可能造成数据丢失。


问题1： VM heap 中的 byte[] 是否无法直接写入到 OS page cache 的
答： 是的，不能直接写，必须经过一次复制到 native 空间（即堆外内存），因为：
  - OS 层面的磁盘写入（如 write()、mmap()）必须依赖native memory（本地内存地址），而不是 JVM 内部管理的对象（如 byte[]）。

问题2: 那 Kafka 为什么还要用 DirectByteBuffer？
答： 因为 Java 的 FileChannel（或者 NIO 体系）在调用 write(ByteBuffer) 方法时，如果你传入的是 heap buffer（HeapByteBuffer），JDK 会偷偷帮你复制到堆外 DirectBuffer，然后再执行 write 系统调用。
哪怕没有显示的使用DirectByteBuffer.其实jvm也在隐士的使用了它，同时显示使用的好处是，这块堆外空间可以复用和池化，如果隐式使用的话，是需要反复创建和销毁的，而且还需要在jvm中先创建这个消息体的byte[];大量占用jvm内存，增加GC压力

问题3: 关于消息的读和写，分别使用了哪些核心技术，使得kafka性能卓越
答：在消息写的时候采用的是DirectBuffer + FileChannel，读的时候大量使用了mmap技术

这边展开mmap的的介绍
mmap 是 将文件在磁盘中的内容映射到 进程虚拟地址空间中的一块物理内存区域，由操作系统负责管理是否将其加载到 page cache。

mmap 的性能优势：
✅ 避免系统调用：不需要 read() 系统调用，不进内核态；
✅ 零拷贝：直接访问 page cache 映射的内存区域；
✅ 按需加载：OS 自动管理物理内存、淘汰缓存页；
✅ 高并发读取友好：Kafka 的读取主路径都能受益；

mmap读取物理磁盘数据与使用read方式读取数据比较
| 方式           | 使用 `read()` 读取                                            | 使用 `mmap()` 读取                            |
| ------------ | --------------------------------------------------------- | ----------------------------------------- |
| 数据加载         | 系统调用后，内核将磁盘内容读入 page cache，再复制一份到用户空间 buffer（你传的 byte\[]） | 系统只在你访问该页时加载对应文件页到 page cache，直接映射到进程虚拟空间 |
| 是否 copy 到用户态 | ✅ 有额外复制：page cache → byte\[]                              | ❌ 无复制，直接访问 page cache                     |
| 控制权          | 程序手动读                                                     | 程序直接访问内存，由 OS 自动控制加载和淘汰                   |
| 性能           | 中等，每次都要 copy                                              | 较高，尤其适合频繁小文件读                             |


mmap在kafka中的使用场景：
| 文件类型                       | 使用 mmap 吗？   | 原因                           |
| -------------------------- | ------------ | ---------------------------- |
| `.log` segment 文件（消息内容）    | ✅ 可用 mmap 读取 | 避免手动读磁盘，利用 page cache 提高读取性能 |
| `.index`、`.timeindex` 索引文件 | ✅ 强制使用 mmap  | 索引是小文件，读频繁，非常适合 mmap         |
| `.snapshot` 等 metadata     | ✅ 也会 mmap 读取 | 更快的加载速度                      |

Kafka 使用 Java NIO 的 FileChannel.map() 方法，将磁盘文件映射为 MappedByteBuffer，然后就可以像访问内存一样访问文件内容，而 OS 会自动处理是否从 page cache 读取，还是从磁盘加载。

page cache 是什么？
page cache 是操作系统内核管理的一块缓存区，属于内核态（kernel space）。
当你 mmap 一个文件，系统不会立刻将磁盘内容全部读取，而是：
- 你访问某一页（例如读文件第 10MB 的部分）时，OS 才会去：
  - 查 page cache 是否已经缓存；
  - 如果有，就直接返回数据（零磁盘 IO）；
  - 如果没有，才会从磁盘加载对应页到 page cache，再映射到你的虚拟地址。
这个机制叫做 lazy loading（按需加载）。
