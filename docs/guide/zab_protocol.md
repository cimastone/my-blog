---
title: "zab协议流程详解"
date: 2025-07-23
author: cimaStone
category: "技术架构"
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
- 后续discovery阶段，C会发现zxid=20日志未被过半认可，在sync阶段回滚。**这里描述的过半认可是指是否超过半数节点写入zxid=20即可;不一定是已经ack 或者 该proposal 已commit**，只要超过半数节点含有zxid=20,哪怕没有commit，zxid=20数据也不会丢失

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
- 新leader节点会判断zxid=10的这条日志是否为已commit
  - **如果已commit，哪怕没有达到超过半节点，leader节点在同步阶段也会同步该条日志数据**
  - **如果未commit，则过半节点zxid=9，B本地truncate到9。**
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
> - leader在trunc zxid=10数据是在发送NEWLEADER之前就处理好了，该动作属于sync准备阶段

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

### 6. 集群配置错误

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
| :---: | :--- |
| LOOKING | 1. 正在选举Leader <br> 2. 通过投票/通信，寻找和确认当前集群的Leader是谁（即使最终发现别人已经是Leader，也会退出LOOKING）。|
| DISCOVERY | 新Leader收集Follower日志状态，确定同步点 |
| SYNCING | 日志同步阶段，补齐或回滚日志 |
| FOLLOWING/OBSERVING | 确认了Leader是谁，自己跟随Leader|
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

leader服务器down机，在选举阶段，第一个通过超时检测的节点epoch+1；其它的节点两种情况：
- 也超时检测到leader down机，自身epoch+1，发起广播
- 还未检测到leader down机，但收到epoch+1广播消息，此时不需要等到超时检测，自身节点epoch+1，发起广播选举

防止“旧Leader复活”造成一致性破坏
- 在分布式环境中，网络分区或Leader短暂失联时，旧Leader有可能还活着，但集群已经选出了新Leader（新epoch）。
- 如果旧Leader恢复后还以为自己是Leader，并且继续对外服务或广播proposal，就会导致脑裂、数据不一致。

总结：
- **最大epoch机制确保只有最新一轮选举产生的Leader能服务，所有旧Leader都会被识别和废弃。**
- 这杜绝了因网络分区、误判、Leader复活等造成的“双Leader/脑裂/数据冲突”风险。
- 这是ZAB/FLE等分布式一致性协议在保证强一致性、单一主控的核心技术点之一。
- epoch递增是每次选举的局部属性，只有获得Quorum支持的epoch才生效。


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

6. 集群中Observer

Observer（观察者）是Zookeeper 3.3.0版本引入的一种节点角色。它不参与主节点选举和写操作投票，但可以同步数据并响应客户端读请求。

作用：
   - 扩展读能力
     - Observer节点接收Leader的事务同步，与Follower保持数据一致。
     - 它可以独立响应客户端的读请求，从而提升集群的读吞吐能力，不影响主投票集。
     - 可横向扩展，用于提高读吞吐和数据冗余。
   - 不参与写一致性投票
     - Observer不参与Leader选举，也不参与写请求的Quorum投票。
     - 写操作（如事务Proposal的ack和commit）只依赖于Follower和Leader的ack，Observer的ack不会计入写入Quorum。
     - 这样可以在不影响写一致性的前提下，扩展读性能和集群规模。
   - 减少跨地域写延迟
     - 在跨地域部署时，可将远程机房节点设为Observer，避免因网络延迟影响写入主流程，同时本地提供读能力和数据备份。

应用场景举例：
- 大规模集群：核心投票节点保持奇数（如5台），其余节点均为Observer，提升读能力且不影响写一致性。
- 跨地域容灾：远程Observer节点同步主集群数据，实现异地备份和就近读服务，提升整体可用性和扩展性。

问题解析：
1. 大规模集群（100个）节点，只有5个节点能成为leader/follow，如果5个节点中有节点down机后会怎么样？
   - 5个节点有节点down机后，还是剩下的节点参与选举，不会从observe节点中补足节点，哪些节点能参与选举在配置文件中有定义
   - 当存活节点小于Quorum（多数派）时，整个集群不可接受请求，无法选举leader，所以需要衡量好可用性和一致性的平衡

2. 是否可能存在脏读：
   - Observer节点读取数据，出现脏数据的概率非常低，但理论上存在极小的可能性。
   - Zookeeper的所有节点（包括Observer）都会同步Leader的所有已commit事务，因此Observer通常能读到最新已提交的数据。
   - 但Zookeeper是“最终一致性”，不是强一致性，在极个别场景下，Observer读到的数据可能比Leader稍旧，尤其是在网络延迟、同步滞后的情况下。

**解决方案：**  
- 大多数业务对这种“亚秒级最终一致性”能容忍。
- 如果对强一致性有要求（比如必须读到最新写入的数据），应将读请求发到Leader，或使用“同步读”机制（如调用sync()后再读）。
- Zookeeper客户端有sync()方法，可以强制节点与Leader对齐后再读，避免脏读。

---

7. 重启的节点如何恢复数据

- 节点初始值
  - zxid：节点重启时，会从本地磁盘上的日志文件和快照中恢复，恢复到重启前最后commit的zxid。
  - epoch：节点重启时，通常会记住上次的epoch（持久化在磁盘中，如currentEpoch文件），恢复后作为自己当前epoch。
- 以looking的状态重启，主动尝试寻找leader
  - 无leader时，加入选举投票，这里有个细节着重说明，重启的节点之前如果是leader节点，并且快速启动参与选举，这时可能会重新成为leader
    - down机前，Proposal已写入未广播，此时重启节点的zxid最大，较大概率成为leader，因最新zxid未被过半节点数包含，在sync阶段会truncate
    - down机前，Proposal已广播未commit，这时分为两类场景：
      - 过半节点已写入proposal未ack && 过半节点ack但未commit：此时重启节点的zxid不是最大，不一定会成为leader，**但未commit广播的那条日志不会丢失，会重新带入新的集群内**
      - 未达到过半节点写入proposal，此时不一定会成为leader，down机前的proposal在新leader#sync阶段会回滚
  - 有leader时，与leader建立连接，leader主动发送LEADERINFO/NEWLEADER等消息，进入discovery/sync阶段日志同步

---

8. Proposal已写入 VS proposal未commit

- proposal已写入
  - 通常指Leader节点已经把proposal日志写入到本地磁盘，并开始向其他Follower节点广播proposal。
  - 这时，proposal只在Leader（和可能部分Follower）日志中存在，还没有达成集群共识。

- proposal未commit
  - 指该proposal尚未收到过半节点的ack确认（Leader还未统计到Quorum），也就是还没有“commit”。
  - 这时proposal对外是不可见的，也不会被应用到状态机。
 
**二者关系**  
- 本质上是同一阶段的不同描述：
  - “已写入”强调日志已落地但未达成共识，
  - “未commit”强调还没进入可见的commit状态。
- 在ZAB协议语境下，一个proposal只有在被commit之前，无论是刚写入还是已被部分Follower写入，都属于“未commit”状态。

---

9. 原子广播状态，是不是必须得leader commit后才能接受客户端下一个请求?

不是必须等 Leader commit 后才能接收下一个客户端请求，但有顺序和队列的控制。
详细解释：
  - Leader可以并发接收多个客户端请求
    - Leader节点可以连续不断地接收客户端的写请求，并为每个请求生成 proposal（事务日志），分配递增 zxid。
    - 这些 proposal 可以批量或流水线（pipeline）方式广播给 follower。
  - Leader可以为多个请求生成 proposal 并同时广播
    - Leader可以在前一个 proposal 尚未 commit 时，先为后续请求生成 proposal 并广播，从而提升吞吐量。
    - 这就是Zookeeper支持的“流水线提交（pipelining）”能力。
  - commit顺序严格受zxid控制
    - 多个proposal的commit必须严格按zxid顺序应用。
    - follower收到commit指令，也必须按zxid顺序apply到状态机。
    - follow ack消息中会携带zxid，不会导致commit错乱，同时哪怕是zxid大的消息先收到过半数的ack，也需要判断前面的proposal是否commit,如果没有则会等待；**commit顺序永远严格递增，永远不会乱序。**
  - 但客户端“线性一致性”有保护
    - 如果客户端要求严格线性一致性（如同步写），Leader通常会等前一个请求commit后再向客户端返回成功。
    - 但Leader本身不需要等commit再accept下一个请求，只是客户端感知层面有个“事务已落地”的等待。






