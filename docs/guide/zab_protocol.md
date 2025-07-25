---
title: "zab协议流程"
date: 2025-07-23
author: cimaStone
category: "技术架构/zab协议流程"
tags: 
  - 技术架构
  - zab协议
---

# zab协议流程详解

## 🎯 背景
ZAB（Zookeeper Atomic Broadcast）协议是Zookeeper集群实现分布式一致性和高可用的核心机制。它主要用于Leader选举与分布式日志同步，确保在分布式环境下数据的一致性和可用性。

---

## 一、ZAB协议核心流程概述

1. **Leader选举**
   - 当Zookeeper集群启动或Leader失效时，ZAB负责通过选举算法选出唯一的Leader节点。

2. **原子广播（日志同步）**
   - Leader负责接收所有写请求，并将变更操作以事务日志（Proposal）的方式广播到Follower。
   - 确保所有节点应用日志的顺序一致，实现线性一致性。

3. **数据恢复**
   - 如果Leader宕机或集群重启，ZAB通过日志回放等方式恢复集群数据一致性。

---

## 二、Leader选举流程

Zookeeper集群通过**投票机制**选举出数据最新（zxid最大）且epoch（任期）最高的Leader，其他节点成为Follower（或Observer）。Leader负责所有写请求与事务操作，Follower主要处理读请求。

### 为什么需要选举？

- 保证集群始终只有一个Leader，避免脑裂。
- Leader挂掉后，能自动选出新的Leader。
- 保证分布式一致性。

### 选举算法简述（以Fast Leader Election为例）

选举过程分为两大阶段：

#### 1. 提名与投票

- 启动时，每个节点自认Leader，广播自己的投票（myid、zxid、epoch）。
- 各节点收到投票后，比较优先级（epoch > zxid > myid），把票投给优先级最高的节点。
- 投票会经历多轮，每收到更优投票，就更新投票并再次广播。

**案例：优先级比较与多轮投票过程**

假设有5个节点A~E：

| 节点 | myid | zxid | epoch |
| :---: | :---: | :---: | :---: |
| A | 1 | 10 | 0 |
| B | 2 | 20 | 0 |
| C | 3 | 15 | 0 |
| D | 4 | 18 | 0 |
| E | 5 | 17 | 0 |

- 初始时所有节点自投。
- A监听到C投票（3,15,0），发现C优先级高，改为投C。
- A又监听到E投票（5,17,0），再投E。
- 最后监听到B投票（2,20,0），发现B优先级最高，最终全体都投B。

#### 2. 收敛与确认

- 当某节点获得过半数（n/2+1）节点支持时，宣布自己为Leader。
- 其它节点收到Leader宣布后切换为Follower，并与Leader同步数据，选举结束。

---

## 三、原子广播（日志同步）流程

Leader负责接收客户端写请求，将数据转为Proposal，广播到所有Follower。只有Proposal被过半节点ack后，Leader才会commit，通知所有节点应用到状态机，对外可见。

```bash
Client --> Leader --> Follower
   |         |           |
   |--req--->|           |
   |         |--proposal->|
   |         |--proposal->| ...
   |         |<-ack------ |
   |         |<-ack------ | ...
   |         |            |
   |<--commit通知(过半)---|
```

**步骤：**

1. 客户端发送写请求到Leader。
2. Leader生成Proposal（带zxid），广播给所有Follower —— 此时leader的zxid值已更新。
3. Follower写入本地日志，回复ACK给Leader —— 写入本地日志即代表节点zxid值已更新。
4. Leader收到过半ACK（含自己），认为Proposal已被原子持久化。
5. Leader广播commit消息，所有节点应用事务，对客户端响应 —— 这里不需要follow ack,因为只是通知对外可见，可能会影响读。

### 【案例1】正常原子广播流程

- Client向A请求“set x=1”。
- A生成Proposal（zxid=101），同步到B、C、D、E。
- B、C、D写日志并ack。
- A收到B/C/D的ack（共4票，过半），广播commit（zxid=101）。
- 所有节点应用zxid=101，x=1，完成原子广播。

---

## 四、崩溃恢复（重新选举+同步）

崩溃恢复指的是Leader宕机或集群大部分节点短暂不可用后，系统如何恢复一致性并恢复服务。

### 总流程

1. **崩溃检测与重新选举（Leader Election）**
2. **新Leader发现（Discovery Phase）**
3. **日志同步（Sync Phase）**
4. **恢复正常服务（Broadcast/Commit）**

---

### 1. 崩溃检测与重新选举（Leader Election）

#### 【场景1】Leader Proposal仅本地写入，未广播

| 节点 | myid | zxid | epoch |
| :---: | :---: | :---: | :---: |
| A | 1 | 19 | 0 |
| B | 2 | 20 | 0 |
| C | 3 | 19 | 0 |
| D | 4 | 19 | 0 |
| E | 5 | 19 | 0 |

- B宕机，A/C/D/E检测到Leader失联，发起选举。
- 所有节点epoch+1，广播自身投票，优先级规则epoch>zxid>myid，最终E成为Leader。

#### 【场景2】Leader Proposal已广播未commit

| 节点 | myid | zxid | epoch |
| :---: | :---: | :---: | :---: |
| A | 1 | 19 | 0 |
| B | 2 | 20 | 0 |
| C | 3 | 20 | 0 |
| D | 4 | 19 | 0 |
| E | 5 | 19 | 0 |

- B宕机，A/C/D/E发起选举，最终C（zxid=20）成为Leader。
- 后续discovery阶段，C会发现zxid=20日志未被过半认可，在sync阶段回滚。

--- 

#### 【场景3】Leader Proposal已commit

| 节点 | myid | zxid | epoch |
| :---: | :---: | :---: | :---: |
| A | 1 | 20 | 0 |
| B | 2 | 20 | 0 |
| C | 3 | 20 | 0 |
| D | 4 | 20 | 0 |
| E | 5 | 19 | 0 |

- B宕机，A/C/D/E选举，D成为Leader。
- D在discovery阶段发现E需补齐日志，sync阶段补齐即可。

--- 

### 2. 新Leader发现阶段（Discovery Phase）

- 新Leader与Follower建立连接，进入discovery。
- Leader发送LEADERINFO消息，Follower回复自己的epoch、zxid等。
- Leader收集所有回复，确定“集体共识点”（过半节点持有的最大zxid）。
- 不做数据同步，仅收集和比较信息。

#### 【案例2】Discovery阶段日志对账举例

| 节点 | myid | zxid | epoch |
| :---: | :---: | :---: | :---: |
| A | 1 | 10 | 0 |
| B | 2 | 10 | 0 |
| C | 3 | 9 | 0 |
| D | 4 | 9 | 0 |
| E | 5 | 8 | 0 |

- Leader（B）发送LEADERINFO，收集Follower zxid。
- 过半节点zxid=9，B本地truncate到9。
- 后续同步阶段各节点分别处理日志。

---

### 3. 日志同步阶段（Sync Phase）

- Leader根据discovery结果，为每个Follower制定同步计划（DIFF/TRUNC/SNAP）。
- NEWLEADER消息告知Follower同步起点。
- Follower收到同步消息后处理本地日志并ack。
- Leader只需收到过半ack即可进入commit。

#### 【案例3】Sync阶段补齐/回滚日志举例

- B本地日志zxid=10，A=10，C/D=9，E=8。
- B和A需truncate到9；E需补日志到9；C/D直接ack。
- Leader收到过半ack后，发送commit，所有节点恢复服务。


> 注意点：
> - leader在discover和sync阶段发送消息中的zxid是不一样的
>   - discover阶段发送本地日志最新的zxid=10，
>   - sync阶段NEWLEADER消息是发送超过半数节点zxid=9,把未超过半数节点的zxid进行回滚
> - leader在trunc zxid=10数据是在发送NEWLEADER之前就处理好了

---

### 4. 恢复正常服务（Broadcast/Commit）

- Leader收到过半ack后，向所有Follower发送COMMIT/UPTODATE，通知同步完成。
- 节点切换为正常服务状态，恢复处理客户端请求。

```plaintext
[崩溃检测]
B宕机
A/C/D/E检测到B失联，启动选举

[选举]
A获胜，成为Leader

[Discovery]
A发LEADERINFO给C/D/E
C/D/E回报各自zxid/epoch
A收集信息，判断集体最大zxid=10

[Sync]
A自己本地truncate，过半节点数zxid=9,truncate zxid=10,只保留zxid=9日志数据
A补齐E日志到9（发送DIFF）
A等待C/D/E的ack（同步完成）

[Commit]
A发COMMIT/UPTODATE通知所有节点
A/C/D/E切换为正常服务状态
```

---

## 五、异常与边界场景举例

### 1. 网络分区导致无法形成多数派

**案例：**

- 5节点（A~E），分区A/B、C、D/E。
- A/B分区只有2票，不足过半（5/2=2.5），无法选Leader。
- 集群暂停写服务，保证一致性。 

**应对方式：**  
- Zookeeper要求必须有多数节点（Quorum）才能选出Leader，没有多数派则无法完成选举，这样可以防止脑裂（双Leader）现象。

### 2. 脑裂（双Leader）

**案例：**

- 假设有7个节点，分为4/3分区：A, B, C, D在一组，E, F, G在另一组。
- 如果网络异常，两个分区都各自有超过半数节点（比如有bug或配置错误），可能各自选出Leader，这就是“双Leader”或“脑裂”现象。

**应对方式：**  

- Zookeeper设计时严格要求只有一个分区能达成Quorum并选出Leader，另一个分区无法达成Quorum只能成为Follower或Observer，防止双Leader。但如果实现有bug或网络极端异常，理论上还是有脑裂风险。

### 3. 节点频繁宕机或重启

**案例：**

- 5个节点，不断有节点重启或崩溃，比如刚刚凑够半数投票，某个节点又宕机或重新启动，投票又要重新发起，选举过程一直无法结束。

**应对方式：**  

- Zookeeper有超时机制，选举超过限定时间会重试，直到集群稳定为止。如果节点一直波动，集群就无法进入稳定状态。

### 4. 网络延迟、消息乱序

**案例：**

- 节点A收到B的投票后改为支持B，但由于网络延迟，A的旧投票又被其它节点收集并投给了A，导致投票混乱或反复切换，选举过程变慢。

**应对方式：**  

- Zookeeper协议有epoch（轮次）机制，每轮选举会递增epoch，旧轮次的投票会被忽略，可以最终收敛。

### 5. 拜占庭异常（恶意节点）

**案例：**

- 某个节点恶意广播虚假投票、伪造选举数据，导致其它节点被误导，选举无法达成一致或出现异常Leader。

**应对方式：**  

- Zookeeper不防拜占庭攻击，只防止普通故障，如果有节点作恶，确实可能导致异常，这也是Zookeeper不适用于区块链/高安全场景的原因。

6. 集群配置错误

**案例：**

- 配置文件错误，导致各节点认为集群规模不同（比如有的认为是5节点，有的认为是7节点），投票规则不一致，选举无法进行。

**应对方式：**  

- 集群必须配置一致，Zookeeper启动时会校验配置，否则会拒绝启动。

### 总结

Zookeeper主要异常选举场景：
  - 网络分区导致无法获得多数派，无法选出Leader。
  - 网络极端分区或实现Bug导致脑裂（双Leader）。
  - 节点频繁宕机或重启，选举过程一直无法收敛。
  - 网络延迟或消息乱序导致选举周期长或反复。
  - 拜占庭（恶意节点）异常，Zookeeper无法防御。
  - 配置不一致导致投票规则混乱。

**绝大多数情况下，Zookeeper能通过Quorum和epoch机制防止双Leader，只要网络和配置正常，最终能收敛选举。**

---

## 六、ZAB各类消息类型与作用

| 消息类型 | 方向 | 主要内容 | 作用 |
| :---: | :---: | :---: | :---: |
| LEADERINFO/NEWLEADER | Leader → Follower | epoch, myid, zxid | 宣告身份、启动discovery流程 |
| FOLLOWERINFO/ACKEPOCH | Follower → Leader | epoch, myid, zxid | 汇报日志进度 |
| NEWLEADER | Leader → Follower | epoch、zxid等 | 同步流程开始 |
| DIFF | Leader → Follower | proposal日志 | 补齐缺失日志 |
| TRUNC | Leader → Follower | 目标zxid | 回滚多余日志 |
| SNAP | Leader → Follower | 快照 | 全量同步 |
| ACK | Follower → Leader | - | 同步完成回复Leader |
| COMMIT/UPTODATE | Leader → Follower | - | 宣布同步结束，切换服务状态 |

---

## 七、节点状态机阶段

| 状态 | 场景与含义 |
| :---: | :---: |
| LOOKING | 正在选举Leader，还未确定 |
| DISCOVERY | 新Leader收集Follower日志状态，确定同步点 |
| SYNCING | 日志同步阶段，补齐或回滚日志 |
| FOLLOWING | Follower已同步完成，正常跟随Leader |
| LEADING | 本节点为Leader，处理写请求与广播 |

---

## 八、核心概念解读与协议对比

1. Quorum（多数派）在Zookeeper中的定义
   - Zookeeper采用Quorum机制，多数派=集群节点数的半数以上。
   - 如果有5个节点：A、B、C、D、E。半数以上是3票（因为5/2=2.5，向上取整为3）。

通过Quorum（多数派）机制防止网络分区时的脑裂场景，只允许多数派的分区选Leader，少数派的分区只能等待恢复通信。如果你看到“两个分区都能选Leader”这种说法，通常指的是理论上如果协议实现有问题或者集群配置不合理时才会出现，正常情况下Zookeeper不会这样

---

2. 什么是epoch？
   - epoch（又叫term、轮次、时期）用来标记选举或协议推进的“轮数”。
   - 每当开始新一轮选举或发生重大变更时，epoch就会+1。
   - epoch越大，代表越“新”的一轮，优先级高。

---

3. 如何判断老Leader down机？
  Zookeeper等分布式系统通常采用心跳机制和超时检测来判断Leader是否存活：
    - 心跳机制：Follower节点会定期向Leader发送心跳包，或者Leader定期向Follower发送心跳包。
    - 超时检测：如果在某个超时时间（如 sessionTimeout）内没有收到Leader的心跳/响应，Follower就认为Leader已经失效（Down机、网络不可达等）。

  **详细流程举例：**  
  - 节点A是Leader，节点B/C/D/E是Follower。
  - B、C、D、E持续等待A的心跳。
  - 如果B在超时时间内（比如2秒、5秒）没有收到A的心跳，就判断A已不可用。
  - 一旦检测到Leader不可用，B就会触发新一轮选举。

---

4. 与paxos协议的差异
   - 目标与适用场景
      - Paxos
        - 目的是在不可靠网络上达成任意值的一致性共识（即同意一条提议/日志）。
        - 可用于通用的分布式一致性，比如分布式数据库、日志复制等。
        - 理论性更强，实现更通用，但复杂。
      - ZAB（Zookeeper Atomic Broadcast）/FLE
        - 主要用于Zookeeper，为Zookeeper的主从模式设计。
        - 目标是选举唯一Leader，以及在Leader下进行顺序一致的日志复制。
        - 选举与日志广播一体化，实现为Zookeeper服务量身定制，偏工程实用。
    - 协议流程上的主要差别
       - Paxos（经典Paxos）
         - 分为Prepare/Promise（第一阶段）、Accept/Accepted（第二阶段），每一条日志都要达成一次共识。
         - 没有Leader角色（或说Paxos Leader只是优化，不是协议本质），理论上每条提议都可以由任意节点提出。
         - 强调每一条决议都独立共识，协议简洁但实现复杂。
       - Zookeeper ZAB/FLE
         - 明确有Leader和Follower角色，Leader负责发起提案，Follower仅投票/同步。
         - 选举Leader用快速选举（FLE），日志同步用ZAB广播。
         - 只有Leader能写数据，Follower只读，适合主从场景。
    - 一致性保证方式
       - Paxos
         - 通过多数派（quorum）投票、编号（proposal number/ballot/epoch）保证无冲突、无脑裂。
         - 理论上可以支持高并发写，多Leader，但实现难度高。
       - ZAB/FLE
         - 依赖Leader唯一性，所有写都经Leader顺序广播。
         - 只要有多数节点存活+Leader在，保证线性一致性。
         - 不能多Leader写，写入吞吐有限。
    - 易用性与工程实践
       - Paxos
         - 理论完善，但工程实现难度大（尤其是Multi-Paxos/Generalized Paxos），易出错。
         - 很多系统（如etcd、consul）用Raft替代Paxos，因Raft更易实现和理解。
       - ZAB/FLE
         - 工程上更好落地，Zookeeper的选举和数据同步分离，便于维护。
         - 易于日志回放和Leader恢复。
    - 易于日志回放和Leader恢复。
       - Paxos每条日志都独立选举一次；ZAB选一次Leader后，所有写日志都由Leader顺序广播。
       - ZAB协议专为Zookeeper设计，选举协议更贴合Zookeeper的数据模型和使用场景。

**总结：**

- Paxos是通用、一致性理论的“祖师爷”，可多Leader、理论更强，但实现复杂。
- ZAB/FLE是为Zookeeper主从架构定制的，强调唯一Leader、顺序广播，工程实现更直接、实用。

---

5. FLE与ZAB是什么关系？
 - FLE（Fast Leader Election）：Zookeeper内置的Leader选举算法。
   - 作用：保证在集群启动或Leader失效时，能快速选出唯一的新Leader。
   - 本质：只负责谁是Leader，和日志同步与否无关。
  
 - ZAB（Zookeeper Atomic Broadcast）：Zookeeper的分布式一致性协议。
   - 作用：保障Leader和Follower之间数据同步、日志复制和事务一致提交。
   - 包含两大阶段：选举（用FLE） + 原子广播（日志同步和提交）。

关系总结：FLE是ZAB协议中的“选举”子部分，ZAB覆盖了选举+日志同步的全过程。
选Leader时用FLE，Leader产生后，日志复制与一致性保证全靠ZAB的原子广播机制。

---





