---
title: "kafka - 简介"
date: 2025-08-26
author: cimaStone
category: "技术架构/kafka"
tags: 
  - kafka
---

# kafka 介绍

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

kafka写入消息时的数据流转
        ┌───────────────────────────────┐
        │          内核态               │
        │                               │
        │   [Socket Buffer]             │
        │        │                      │
        │        ▼                      │
        │   [Page Cache] <─── write ─── │
        └───────▲───────────────────────┘
                │
                │ read
        ┌───────┴───────────────────────┐
        │          用户态（Broker进程） │
        │                               │
        │   [DirectBuffer]   ←────┐     │
        │        │               │     │
        │        ▼               │     │
        │     [Heap]             │     │
        │        │               │     │
        │        ▼               │     │
        │   [DirectBuffer] ──────┘     │
        └──────────────────────────────┘


问题1： VM heap 中的 byte[] 是否无法直接写入到 OS page cache 的
答： 是的，不能直接写，必须经过一次复制到 native 空间（即堆外内存），因为：
  - OS 层面的磁盘写入（如 write()、mmap()）必须依赖native memory（本地内存地址），而不是 JVM 内部管理的对象（如 byte[]）。

问题2: 那 Kafka 为什么还要用 DirectByteBuffer？
答： 因为 Java 的 FileChannel（或者 NIO 体系）在调用 write(ByteBuffer) 方法时，如果你传入的是 heap buffer（HeapByteBuffer），JDK 会偷偷帮你复制到堆外 DirectBuffer，然后再执行 write 系统调用。
哪怕没有显示的使用DirectByteBuffer.其实jvm也在隐式的使用了它，同时显示使用的好处是，这块堆外空间可以复用和池化，如果隐式使用的话，是需要反复创建和销毁的，而且还需要在jvm中先创建这个消息体的byte[];大量占用jvm内存，增加GC压力
| 目的               | 说明                                   |
| ---------------- | ------------------------------------ |
| ✅ 避免 JVM 自动 copy | JVM 自动生成的 direct buffer 每次都新建        |
| ✅ 可以池化重用         | Kafka 自己管理 DirectBuffer，避免频繁申请释放堆外内存 |
| ✅ 减少 GC 压力       | 堆内对象可以更早回收，堆外 buffer 也更稳定            |
| ✅ 更可控、更高性能       | 比 JVM 帮你偷偷 copy 效率高得多                |


问题3: 关于消息的读和写，分别使用了哪些核心技术，使得kafka性能卓越
答：在消息写的时候采用的是DirectBuffer + FileChannel，读的时候大量使用了mmap技术

这边展开mmap的的介绍
  - mmap 是 将文件在磁盘中的内容映射到 进程虚拟地址空间中的一块物理内存区域，实际数据来源来自 OS 的 page cache，不是直接从磁盘， 由操作系统负责管理是否将其加载到 page cache。

mmap 映射到了哪里？
  - 是映射到了 进程的用户空间（virtual address space），不是 Java 堆（heap），但 Java 可以访问它（通过 MappedByteBuffer）。
  - 所以，这块内存 属于用户态（user space）。
  - 堆外内存（DirectByteBuffer、Unsafe 分配的）也是位于这块空间里。你可以理解为：
  - mmap、DirectByteBuffer 本质上都属于 进程的虚拟用户空间，而不是 JVM heap。

mmap 实现的是「共享内存映射」（shared mapping）
```bash
【磁盘】───>（缺页时读入）───>【page cache】
                             ↘
             mmap           【Java 进程虚拟内存（VMA）】
                             ↘
                        【Java process 可读写】

```
- 内核没有「复制」数据；
- 内核只是在 Java 进程的页表里，挂载了这一页物理内存；
- 你访问这个虚拟地址，其实访问的就是 page cache 的那块物理内存。

page cache 是什么？
page cache 是操作系统内核管理的一块缓存区，属于内核态（kernel space）。
当你 mmap 一个文件，系统不会立刻将磁盘内容全部读取至内存，它只是在java pocess 建立了一个虚拟地址映射表，会看到一大块 VIRT 区域（top 命令里会显示）：
- 你访问某一页（例如读文件第 10MB 的部分）时，OS 才会去：
  - 查 page cache 是否已经缓存；
  - 如果有，就直接返回数据（零磁盘 IO）；
  - 如果没有，才会从磁盘加载对应页到 page cache，再映射到进程的地址空间，才会对应页进入物理内存，占Java 进程的实际物理内存 RES，把那一页 page cache 映射到了 Java 进程虚拟地址空间中，这个页既属于 page cache，也属于 Java 进程的 RES。不是 copy 到 Java 的进程空间
  - 然后在java heap中使用MappedByteBuffer访问 OS page cache 中的内容，整个过程中 没有发生 copy
这个机制叫做 lazy loading（按需加载）。

mmap 的性能优势：
- ✅ 避免系统调用：不需要反复 read()，省下内核态 ↔ 用户态切换
- ✅ 零拷贝：直接访问 page cache 映射的内存区域；
- ✅ 按需加载：OS 自动管理物理内存、淘汰缓存页；
- ✅ 高并发读取友好：文件内容可以被多个线程并发访问而不需多次 read
- ✅ 自动淘汰机制：OS 管理 page cache，有 LRU 和写回机制，无需你手动管理内存释放，page cache 自动预读、淘汰，线程不用管冷热数据
- ✅ 不重复映射：映射是文件级的，所有线程共享同一段地址空间
- ✅ 无锁读：每个线程自己读自己需要的地址，不需要全局锁

它让你以“访问内存”的方式访问磁盘文件，但性能几乎和访问内存一样快。

mmap读取物理磁盘数据与使用read方式读取数据比较
| 方式           | 使用 `read()` 读取                                            | 使用 `mmap()` 读取                            |
| ------------ | --------------------------------------------------------- | ----------------------------------------- |
| 数据加载         | 系统调用后，内核将磁盘内容读入 page cache，再复制一份到用户空间 buffer（你传的 byte\[]） | 系统只在你访问该页时加载对应文件页到 page cache，直接映射到进程虚拟空间 |
| 是否 copy 到用户态 | ✅ 有额外复制：page cache → byte\[]                              | ❌ 无复制，直接访问 page cache                     |
| 控制权          | 程序手动读                                                     | 程序直接访问内存，由 OS 自动控制加载和淘汰                   |
| 性能           | 中等，每次都要 copy（三次），磁盘 → Page Cache， Page Cache → JVM native，JVM native → Java heap  | 较高，尤其适合频繁小文件读                             |
| 是否进 JVM heap | ✅ 是                                             | ❌ 否                            |
| 是否占用 Java RES 内存           | 明显增加（heap 中分配 buffer）                                              | 部分（访问哪些页才占）                             |
| 是否可并发读不同地址           | ❌ 每次都得重新 read/copy                                             | ✅ 非常好                            |
| 典型用法           | 普通应用文件读写                                               |                             |Kafka 文件读取、Lucene 索引、Redis 持久化



mmap在kafka中的使用场景：
| 文件类型                       | 使用 mmap 吗？   | 原因                           |
| -------------------------- | ------------ | ---------------------------- |
| `.log` segment 文件（消息内容）    | ✅ 可用 mmap 读取 | 避免手动读磁盘，利用 page cache 提高读取性能 |
| `.index`、`.timeindex` 索引文件 | ✅ 强制使用 mmap  | 索引是小文件，读频繁，非常适合 mmap         |
| `.snapshot` 等 metadata     | ✅ 也会 mmap 读取 | 更快的加载速度                      |

Kafka 使用 Java NIO 的 FileChannel.map() 方法，将磁盘文件映射为 MappedByteBuffer，然后就可以像访问内存一样访问文件内容，而 OS 会自动处理是否从 page cache 读取，还是从磁盘加载。

mmap 本质上是：
  - Java 进程的虚拟地址空间 ↔ page cache 中的文件页 建立映射；
  - 访问该地址时，系统按需从 page cache / 磁盘加载数据；
  - MappedByteBuffer 访问的是 page cache 内容，没有 copy；
  - 映射的内存属于 Java 进程，但不属于 JVM heap；
  - mmap 非常适合高并发读，线程读不同地址互不影响。


问题4: 为什么 mmap 更适合高并发读？
答：
1. 每个线程可以并发访问不同地址，互不干扰；
2. 没有 read() 的锁和线程切换；
3. 没有 copy，每个线程直接用 MappedByteBuffer.get(offset) 读取；
4. page cache 有良好的缓存淘汰策略，避免频繁读磁盘。

这就是为什么 Kafka 读取 .log 和 .index 文件时大量使用 mmap，性能极高

问题5: 那 1 万个线程 mmap 读取 1 万页，会不会 OOM？
答：
1. page cache 是 OS 统一管理的缓存区
  - mmap 访问的内容都走 page cache；
  - 如果你访问了 1 万页数据，那么这些页可能都在 page cache；
  - 并不是每个线程会“私有”一页 —— 所有线程共享 page cache。

2. 一个线程访问一页 ≠ 一页进内存
  - mmap 是懒加载的；
  - 只有真的触发 page fault 才读页进来；
  - 线程访问完之后，这页也可能被 OS 回收（page cache 是可回收的）；

3. mmap 的映射属于共享内存，不是分配堆外内存
  - 并不会像 new byte[] 一样让堆外或堆内一直增长；
  - 只占用一个页（4KB）大小的 page cache 页面；
  - 所以你即使有 1 万线程读，也就是最多 1 万页（40MB）左右的额外 page cache 占用（当然实际情况更复杂，比如预读、换页等）。

mmap 不会 copy 数据，只是将 page cache 中的页「映射」到了用户态进程的虚拟地址空间，访问这些地址就是直接访问 page cache 中的数据。

```bash
【磁盘】
   ↓
（缺页触发 IO）
   ↓
【page cache】 <---> mmap <---> Java process 虚拟地址空间（MappedByteBuffer）
                                   ↓
                             buffer.get(i)

```
✔️ 共享，不复制
✔️ 访问会导致 page cache 页面映射进来（增加 RES）
✔️ 多个线程访问也只是共享映射

问题6: Kafka 为何索引用 mmap，日志 segment 不用？
答：因为索引文件数据比较小，而 segment 文件太大，多线程处理会导致 Java process 常驻内存大

| 文件类型                             | 大小        | 访问模式        | 适合的 IO 策略                                                               |
| -------------------------------- | --------- | ----------- | ----------------------------------------------------------------------- |
| **Index 文件**（offset -> position） | 小（< 1MB）  | 高频随机读       | `mmap` 映射到内存，随机访问非常快（页常驻，Page Cache 命中率高）                               |
| **Time Index / Txn Index**       | 小         | 偶尔读写        | 同上                                                                      |
| **Segment 文件**                   | 非常大（上 GB） | 主要顺序写、偶尔顺序读 | **顺序磁盘 IO 更高效，不适合 mmap。使用 FileChannel + DirectBuffer + sendfile 实现零拷贝** |

mmap 只能用于读（或顺序小写），不适合大规模频繁写入场景。
```bash
Kafka 内存消息 (堆外 DirectBuffer)
     ↓
FileChannel.write() / gatheringWrites
     ↓
通过 syscall（writev/sendmsg）
     ↓
OS kernel 将 buffer 写入 page cache
     ↓
OS 再异步 flush 到磁盘

```

✅ DirectBuffer 是 Kafka 手动管理的一块用户态内存，它避免了 HeapBuffer 的中间 copy，但写的时候仍然要通过 syscall 把数据送入 kernel。
所以：
  - Kafka 写时不能用 mmap，是因为 mmap 写会导致大量脏页难以控制，flush 策略、时机都依赖操作系统；
  - 而使用 DirectBuffer + FileChannel 可以更灵活地控制写入、刷盘、batch、flush、fsync 等；
  - 本质上，是顺序写比 mmap 写可控、效率高。

问题7: 为啥大家都在强调 “用户态 ↔ 内核态之间的 copy 次数”？
因为这才是最影响性能的部分：
  - 用户态 / 内核态切换，需要陷入系统调用（syscall），开销大；
  - 数据跨越用户态/内核态时，必须进行实际 copy；
  - 每次 copy 都需要：
    - 创建/验证页表映射
    - 对缓存行进行失效
    - 调用缓冲策略（CPU 缓存 & pipeline）
    - 触发上下文切换（比如网络 IO 会引发 epoll wakeup）

而如果能把所有操作都压缩在 内核态内部（比如 sendfile），就极大减小了：
  - 内存复制压力
  - CPU 使用率
  - 缓存 miss 率
  - 上下文切换成本

📌 所以零拷贝（Zero Copy）本质上是 用户态不参与 IO 的优化模型，让数据完全在内核中“搬运”。

问题8: MappedByteBuffer.get() 访问某个位置的数据 和 MappedByteBuffer.get(byte[]) 读入 byte[] 区别
答：
| 操作                                            | 属于内核态 → 用户态 copy 吗？ | 是否复制数据？                   | 差别                 |
| --------------------------------------------- | ------------------- | ------------------------- | ------------------ |
| `MappedByteBuffer.get()` **访问某个位置的数据**        | ✅ 是                 | ✅ 是，复制到 JVM 临时寄存器 / stack | 临时数据访问，不存入 Java 对象 |
| `MappedByteBuffer.get(byte[])` **读入 byte\[]** | ✅ 是                 | ✅ 是，复制到 Java heap         | 显式 copy，分配对象       |

更细致解释：
✅ 都是 从 page cache（内核态）→ Java 进程（用户态） 的一次 copy
- MappedByteBuffer.get()
  - 只是访问 mmap 映射区域的某个字节
  - 通常加载到寄存器（JVM 的内部变量、栈）
  - 比如你读取某个 int/long 值校验 header、magic number

- MappedByteBuffer.get(byte[])
  - 明确要求把一段数据 copy 到 Java 对象（heap）
  - 就是典型的「内核态 → 用户态的显式内存复制」

❗️区别只是：是否保留数据到 heap 对象中。
- get()：用于处理数据（验证、解析）
- get(byte[])：用于存储数据（返回给用户、构建消息）
