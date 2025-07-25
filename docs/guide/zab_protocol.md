---
title: "zab协议流程"
date: 2025-07-23
author: cimaStone
category: "技术架构/zab协议流程"
tags: 
  - 技术架构
  - zab协议
---
# zab协议流程

## 🎯 背景
ZAB协议（Zookeeper Atomic Broadcast Protocol）主要用于Zookeeper集群中的Leader选举和分布式日志同步，确保在分布式环境下数据的一致性和可用性。它的核心作用是让所有服务器（节点）在面对网络分区、节点故障等情况下依然保证顺序一致的状态机复制

## 简述
1. Leader选举
   - 当Zookeeper集群启动或Leader失效时，ZAB负责通过选举算法选出唯一的Leader节点。  
2. 原子广播（日志同步）
   - Leader负责接收所有写请求，并将变更操作以事务日志（proposal）的方式广播到所有Follower。
   - 确保所有节点应用日志的顺序一致（线性一致性）。  
3. 数据恢复
   - 如果Leader宕机或集群重启，ZAB可以通过日志回放等方式恢复数据一致性。

## 📖 核心流程
### Leader选举
> 所有节点通过投票，选出一个epoch（任期）最大且数据最新（zxid最大）的节点为Leader。
Zookeeper集群由多个服务器节点组成，其中一个为Leader，其他为Follower（还有Observer）。Leader负责处理写请求和事务性操作，Follower主要负责处理读请求，Observer仅同步数据不参与选举。

**为什么需要选举？**
 - 保证集群只有一个Leader。
 - Leader挂掉后，能自动选出新的Leader。
 - 保证分布式一致性。

#### 选举过程的阶段
Zookeeper的选举算法经历过几次迭代，主要有：Basic Majority Vote、**Fast Leader Election（FLE）**等。以FLE为例，选举过程可以分为两个阶段：

1. 第一阶段：提名与投票
  - 每个节点启动后，都会认为自己是Leader候选人。
  - 节点广播自己的投票，包括：节点ID、事务ID（zxid）、任期（epoch）。
  - 每个节点收到其他节点的投票后，比较投票优先级（优先级规则：epoch > zxid > serverId）。
  - 节点投票给优先级最高的候选人（包括自己）。正常来说第一阶段完成时，应该是所有的投票都指向同一个节点

2. 第二阶段：收敛与确认
  - 当某个节点收到过半数（n/2+1）节点的投票支持自己时，会宣布自己为Leader。
  - 其他节点一旦收到“自己支持的候选人”成为Leader的消息，也切换为Follower，并完成与Leader的同步。
  - 选举结束，进入正常工作状态。

#### 选举算法举例（Fast Leader Election）
设有 5 个节点：A, B, C, D, E假定每个节点有如下属性：
  - myid：节点唯一编号
  - zxid：事务ID（越大越新，优先级越高）
  - epoch：轮次（任期）
    
假设初始状态如下：
| 节点 | myid | zxid | epoch |
| :---: | :---: | :---: | :---: |
| A | 1 | 10 | 0 |
| B | 2 | 20 | 0 |
| C | 3 | 15 | 0 |
| D | 4 | 18 | 0 |
| E | 5 | 17 | 0 |

**初次leader选举**

**第一阶段：提名和投票**
1. 节点启动，自认为Leader，广播投票  
   每个节点都向集群广播自己的选票（myid, zxid, epoch）。   
   例如：
    - A投票：1, 10, 0
    - B投票：2, 20, 0
    - C投票：3, 15, 0
    - D投票：4, 18, 0
    - E投票：5, 17, 0

2. 收到其他节点投票，比较优先级，决定投票对象  
  优先级规则：epoch > zxid > myid
  这里所有节点epoch都为0，比较zxid：
    - B的zxid最大（20），所以其他节点都把投票改为支持B。

3. 节点修改自己的投票
   - A收到B投票后，发现B更优，把自己的投票改为支持B。
   - C、D、E同理。
     
此时所有节点的投票都变成：
  - 投票给B（myid=2, zxid=20, epoch=0）

> 这里补充说明，第一阶段可能发生了多轮投票，每次收到更优的投票，都会重新发起投票，把自己的“投票人”改成当前最优的那个节点，并广播出去。以节点A来说：
> - A节点投票1, 10, 0；监听到C投票3, 15, 0；
> - 发起第二轮投票3, 15, 0，监听到E投票5, 17, 0
> - 发起第三轮投票5, 17, 0，监听到B投票2, 20, 0
> - 发起第四轮投票2, 20, 0

**第二阶段：收敛与确认**
1. 统计投票结果
   B节点发现自己获得了超过半数（3/5）节点的支持。  

2. B宣布自己当选Leader，B节点广播自己成为Leader的消息。

3. 其他节点收到Leader宣布后，切换为Follower
节点A、C、D、E收到B的Leader确认消息后，进入Follower状态，并与Leader同步数据。

4. 选举结束，集群进入工作状态

**leader down机，再次选举的过程，日志未同步**
1. 经过上一轮选举后，B为leader，B节点突然down
 
| 节点 | myid | zxid | epoch |
| :---: | :---: | :---: | :---: |
| A | 1 | 10 | 0 |
| B | 2 | 20 | 0 |
| C | 3 | 15 | 0 |
| D | 4 | 18 | 0 |
| E | 5 | 17 | 0 |

2. B节点down机，通过心跳机制和超时机制，follow节点发现B节点down机，A、C、D、E都会发起新的一轮选举，当然会有先后，举例E节点开始发起新的选举
   - 将epoch + 1处理，向集群内A、C、D节点发起投票
   - A、C、D节点根据是否检测到leader down做以下处理
     - 检测到leader down时，epoch + 1进行广播自身节点
     - 未检测到leader down时，但收到E节点广播，发现epoch == 1，此时不需要等待超时，直接将自己节点的epoch == E节点广播的epoch值，广播自身节点
     - 各节点投票内容：
       - A投票：1, 10, 1
       - C投票：3, 15, 1
       - D投票：4, 18, 1
       - E投票：5, 17, 1
   - 按照epoch > zxid > myid规则进行第一阶段投票，最终会收敛为D节点为leader节点，只需要经过一轮投票则能快速的选举出新leader

  > 虽然A、C、D、E节点在上一轮选举最终投票都是2, 20, 0；在日志未同步的前提下，下一轮选举投票的zxid还是还是根据自身节点的日志获取的

**leader down机，再次选举的过程，日志已同步**
1. 经过上一轮选举后，B为leader，B节点突然down，此时需要分为两种状态

| 节点 | myid | zxid | epoch |
| :---: | :---: | :---: | :---: |
| A | 1 | 20 | 0 |
| B | 2 | 20 | 0 |
| C | 3 | 20 | 0 |
| D | 4 | 20 | 0 |
| E | 5 | 20 | 0 |

2. B节点down机，通过心跳机制和超时机制，follow节点发现B节点down机，A、C、D、E都会发起新的一轮选举，当然会有先后，举例E节点开始发起新的选举
   - 将epoch + 1处理，向集群内A、C、D节点发起投票
   - A、C、D节点根据是否检测到leader down做以下处理
     - 检测到leader down时，epoch + 1进行广播自身节点
     - 未检测到leader down时，但收到E节点广播，发现epoch == 1，此时不需要等待超时，直接将自己节点的epoch == E节点广播的epoch值，广播自身节点
     - 各节点投票内容：
       - A投票：1, 20, 1
       - C投票：3, 20, 1
       - D投票：4, 20, 1
       - E投票：5, 20, 1
   - 按照epoch > zxid > myid规则进行第一阶段投票，最终会收敛为E节点为leader节点，只需要经过一轮投票则能快速的选举出新leader

---
### Discovery阶段（对账）
> 主要用于收集和比较各个Follower（服务器）当前的日志状态（epoch、zxid等），为后续同步打基础。
> - 目标：让Leader了解每个Follower日志的“最新进度”，并选出一个合适的“历史共识点”。
> - 结果：Leader和所有Follower都知道大家的日志有哪些不同，确定后续需要同步的数据范围。
#### 过程描述
 - 新Leader与所有Follower建立连接，进入discovery。
 - Leader发送“NEWLEADER/LEADERINFO”消息，Follower回复自己的最大zxid、当前epoch等信息。
   - LEADERINFO/NEWLEADER（Leader → Follower）
     - 内容：当前epoch、Leader的myid、可能还带有Leader的zxid。
     - 作用：告诉Follower“我现在是新Leader，请报告你的状态”。
   - FOLLOWERINFO/ACKEPOCH（Follower → Leader）
     - 内容：Follower的epoch、zxid、myid。
     - 作用：Follower向Leader汇报“我现在日志到哪了”。
 - Leader收集所有回复后，汇总逻辑：
   - Leader收集所有Follower的ACKEPOCH，根据所有节点的zxid、epoch判断一致性点、补齐/回退需求。
   - 判断：自己是否为“合法Leader”，是否有过半节点支持。
   - 计算出所有节点日志应同步到的最大zxid。
 - 不做数据同步，只收集和比较信息。

---

### 同步（Synchronization）阶段（补齐日志）
> 主要用于实际的数据同步，即Leader将需要补齐的日志（proposal）推送给落后的Follower，使所有节点日志一致。
> - 目标：让所有节点的日志追平到Leader的最新已commit位置。
> - 结果：所有Follower补齐缺失的日志，达到和Leader一致的状态。

#### 过程描述
 - NEWLEADER（Leader → Follower）
   - 内容：当前epoch、Leader的zxid、快照或日志数据（视情况而定）。
   - 作用：告诉Follower“正式进入同步阶段”，有的实现会直接带上需要同步的日志或快照。
 - 基于discovery结果，Leader为每个Follower制定同步计划。DIFF/TRUNC/SNAP（Leader → Follower）
   - 内容：
     - DIFF：发送缺失的proposal日志，让Follower补齐。对于落后的Follower，Leader会把缺失的proposal（日志条目、快照等）发送过来。
     - TRUNC：命令Follower回滚多余日志。如果Follower有未被过半节点写入的proposal，Leader会让其回滚（truncate）。
     - SNAP：发送快照，Follower落后太多时全量覆盖
   - 作用：具体执行日志同步的动作。
 - ACK（Follower → Leader），Follower收到同步数据，写入本地日志，直到与Leader一致。只要过半节点ack就可进入newleader commit，不必等所有节点。
   - 内容：表示Follower已经处理了同步数据，日志已对齐。
   - 作用：Follower通知Leader“同步完成”。
 - COMMIT/UPTODATE（Leader → Follower），所有Follower同步完成后，Leader发送“NEWLEADER COMMIT”通知，Follower进入“正常服务”状态。
   - 内容：通知Follower“同步阶段结束，可以正常服务了”。
   - 作用：Follower收到后正式切换到“FOLLOWING”状态，开始对外服务。

**常见消息类型及作用汇总表**  

| 消息类型	 | 方向 | 主要内容 | 主要作用|
| :---: | :---: | :---: | :---: |
| LEADERINFO/NEWLEADER	 | Leader → Follower	 | epoch, myid, zxid | 宣告身份、启动discovery流程 |
| FOLLOWERINFO/ACKEPOCH | Follower → Leader | epoch, myid, zxid | 汇报日志进度 |
| NEWLEADER | Leader → Follower | 当前epoch、Leader的zxid、快照或日志数据（视情况而定）。 | 同步流程开始 |
| DIFF | Leader → Follower| proposal日志 | 补齐缺失日志 |
| TRUNC | Leader → Follower | 目标zxid | 回滚多余日志 |
| SNAP | Leader → Follower | 快照 | 全量同步 |
| ACK | Follower → Leader | - | 同步完成，回复Leader |
| COMMIT/UPTODATE | Leader → Follower | - | 宣布同步结束，切换服务状态 |

---

**举个例子将discovery && sync阶段进行详细描述**

| 节点 | myid | zxid | epoch |
| :---: | :---: | :---: | :---: |
| A | 1 | 10 | 0 |
| B | 2 | 10 | 0 |
| C | 3 | 9 | 0 |
| D | 4 | 9 | 0 |
| E | 5 | 8 | 0 |

**discovery阶段(B为leader)**
1. leader发送 LEADERINFO信息给各个节点
   - B -> A: epoch=0, zxid=10, myid=2
   - B -> C: epoch=0, zxid=10, myid=2
   - B -> D: epoch=0, zxid=10, myid=2
   - B -> E: epoch=0, zxid=10, myid=2
2. follow告诉leader FOLLOWERINFO信息
   - A -> B: epoch=0, zxid=10, myid=1
   - C -> B: epoch=0, zxid=9, myid=3
   - D -> B: epoch=0, zxid=9, myid=4
   - E -> B: epoch=0, zxid=8, myid=5

此时leader服务器进行汇总和判断，发现zxid=10的这条日志没有过半节点，同时判断哪些节点需要补足日志，整理如下
 - 超过半数节点的zxid值=9；leader节点（B节点）将自己的本地日志只保留到zxid=9的日志
 - 发送给A节点，trunc消息，将A节点zxid=10的日志进行丢弃
 - 发给E节点补充日志zxid=9

**sync阶段(B为leader)**
1. leader先做如下动作：将自己本地日志zxid=10进行会滚
2. leader发送NEWLEADER消息给各个节点
   - B -> A: epoch=0, zxid=9, myid=2
   - B -> C: epoch=0, zxid=9, myid=2
   - B -> D: epoch=0, zxid=9, myid=2
   - B -> E: epoch=0, zxid=9, myid=2
3. leader发送TRUNC消息给A节点 zxid=10进行回滚
4. leader发送DIFF消息给E节点 zxid=9进行补齐
5. follow发给leader ack
   - A -> B: 回滚完成，ack
   - C -> B: 直接ack，不需要做任何处理
   - D -> B: 直接ack，不需要做任何处理
   - E -> B: 补足完成，ack

> 注意点：
> - leader在discover和sync阶段发送自己的zxid是不一样的，在discover阶段就只发送本地日志最新的zxid，而sync发送的NEWLEADER消息是把未超过半数节点的zxid进行回滚的数据
> - leader在trunc zxid=10数据是在发送NEWLEADER之前就处理好了
> - leader接收到超过半数的ack即可发送commit消息
---

### 广播（Broadcast）阶段（正常处理请求）
> - Leader接收客户端写请求，生成Proposal，广播给所有Follower。
> - 超过半数Follower写入成功后，Leader向所有节点发送commit指令，正式提交该事务。
> - 
#### 广播流程
1. Leader接收写请求，生成proposal（事务日志）。
2. Leader将proposal广播给所有Follower。
3. Follower写入本地日志后，回复ACK给Leader。
4. Leader收到过半Follower的ACK后，认为已安全，向所有节点（包括自己）广播commit指令，正式提交该事务。
5. 所有节点收到commit指令后，应用事务到状态机（对外可见）。

#### 日志同步后，原子广播（日志同步）
1. E节点为leader，此时处理了多次请求，zxid不断累积，并同步至其它follow，同时B节点恢复，当前所有节点的各元素值
| 节点 | myid | zxid | epoch |
| :---: | :---: | :---: | :---: |
| A | 1 | 30 | 1 |
| B | 2 | 20 | 0 |
| C | 3 | 30 | 1 |
| D | 4 | 30 | 1 |
| E | 5 | 30 | 1 |
2. B节点重启后，会从E节点同步数据，最终zxid和epoch都会更新至与leader一致，此时E节点再次接收到外部请求

---

### 崩溃恢复（重新选举+同步）
> - 如果Leader宕机，重新选举新Leader，并通过日志同步恢复一致性，重复上述流程。
>



---
这些是Zookeeper节点状态机的不同阶段，每个节点会在不同选举/同步流程中切换：

| 状态 | 场景与含义 |
| :---: | :---: |
| LOOKING | 正在寻找Leader（比如选举进行中），还没有确定谁是Leader | 
| DISCOVERY | 新Leader与Follower建立联系，收集日志状态（epoch/zxid），确定日志同步点（部分实现合成到SYNCING） |
| SYNCING | 日志同步阶段，Leader给Follower补齐缺失日志或让其回滚，直到日志一致 |
| FOLLOWING | Follower已与Leader日志同步完成，正常跟随Leader接受和应用事务 |
| LEADING | 本节点是Leader，负责处理客户端请求、广播proposal、commit等 |

#### 崩溃恢复流程
 - 发生Leader宕机/网络分区等异常，触发重新选举。
 - 新Leader通过Discovery和同步阶段，恢复所有节点到一致状态。
 - 所有commit过的操作不会丢失，未commit的proposal会被丢弃。

--- 

#### 异常场景
1. 网络分区导致无法选出Leader  

**场景举例：**  
假设有5个节点：A, B, C, D, E。
发生网络分区，A、B、C在一个分区，D、E在另一个分区。
假如A、B、C分区开始选举，最优节点C获得A和B的投票，但只有3票，不足半数（需要3/5+1=4票），所以无法选出Leader。  

**应对方式：**  
Zookeeper要求必须有多数节点（Quorum）才能选出Leader，没有多数派则无法完成选举，这样可以防止脑裂（双Leader）现象。

---

2. 网络分区导致双Leader（脑裂）

**场景举例：**  
假设有7个节点，分为4/3分区：A, B, C, D在一组，E, F, G在另一组。
如果网络异常，两个分区都各自有超过半数节点（比如有bug或配置错误），可能各自选出Leader，这就是“双Leader”或“脑裂”现象。

**应对方式：**  
Zookeeper设计时严格要求只有一个分区能达成Quorum并选出Leader，另一个分区无法达成Quorum只能成为Follower或Observer，防止双Leader。但如果实现有bug或网络极端异常，理论上还是有脑裂风险。

---

3. 节点频繁宕机或重启，选举一直无法收敛

**场景举例：**  
5个节点，不断有节点重启或崩溃，比如刚刚凑够半数投票，某个节点又宕机或重新启动，投票又要重新发起，选举过程一直无法结束。

**应对方式：**  
Zookeeper有超时机制，选举超过限定时间会重试，直到集群稳定为止。如果节点一直波动，集群就无法进入稳定状态。

---

4. 消息延迟或乱序导致选举异常

**场景举例：**  
节点A收到B的投票后改为支持B，但由于网络延迟，A的旧投票又被其它节点收集并投给了A，导致投票混乱或反复切换，选举过程变慢。

**应对方式：**  
Zookeeper协议有epoch（轮次）机制，每轮选举会递增epoch，旧轮次的投票会被忽略，可以最终收敛。

---

5. 节点恶意作恶（拜占庭异常）

**场景举例：**  
某个节点恶意广播虚假投票、伪造选举数据，导致其它节点被误导，选举无法达成一致或出现异常Leader。

**应对方式：**  
Zookeeper不防拜占庭攻击，只防止普通故障，如果有节点作恶，确实可能导致异常，这也是Zookeeper不适用于区块链/高安全场景的原因。

---

6. 集群配置错误

**场景举例：**  
配置文件错误，导致各节点认为集群规模不同（比如有的认为是5节点，有的认为是7节点），投票规则不一致，选举无法进行。

**应对方式：**  
集群必须配置一致，Zookeeper启动时会校验配置，否则会拒绝启动。

---
**总结**

Zookeeper主要异常选举场景：
  - 网络分区导致无法获得多数派，无法选出Leader。
  - 网络极端分区或实现Bug导致脑裂（双Leader）。
  - 节点频繁宕机或重启，选举过程一直无法收敛。
  - 网络延迟或消息乱序导致选举周期长或反复。
  - 拜占庭（恶意节点）异常，Zookeeper无法防御。
  - 配置不一致导致投票规则混乱。

**绝大多数情况下，Zookeeper能通过Quorum和epoch机制防止双Leader，只要网络和配置正常，最终能收敛选举。**

---

#### 概念定义
1. Quorum（多数派）在Zookeeper中的定义
   - Zookeeper采用Quorum机制，多数派=集群节点数的半数以上。
   - 如果有5个节点：A、B、C、D、E。半数以上是3票（因为5/2=2.5，向上取整为3）。
通过Quorum（多数派）机制防止网络分区时的脑裂场景，只允许多数派的分区选Leader，少数派的分区只能等待恢复通信。如果你看到“两个分区都能选Leader”这种说法，通常指的是理论上如果协议实现有问题或者集群配置不合理时才会出现，正常情况下Zookeeper不会这样

2. 什么是epoch？
   - epoch（又叫term、轮次、时期）用来标记选举或协议推进的“轮数”。
   - 每当开始新一轮选举或发生重大变更时，epoch就会+1。
   - epoch越大，代表越“新”的一轮，优先级高。

3. 如何判断老Leader down机？
  Zookeeper等分布式系统通常采用心跳机制和超时检测来判断Leader是否存活：
    - 心跳机制：Follower节点会定期向Leader发送心跳包，或者Leader定期向Follower发送心跳包。
    - 超时检测：如果在某个超时时间（如 sessionTimeout）内没有收到Leader的心跳/响应，Follower就认为Leader已经失效（Down机、网络不可达等）。

  详细流程举例：
    - 节点A是Leader，节点B/C/D/E是Follower。
    - B、C、D、E持续等待A的心跳。
    - 如果B在超时时间内（比如2秒、5秒）没有收到A的心跳，就判断A已不可用。
    - 一旦检测到Leader不可用，B就会触发新一轮选举。

4. 与paxos协议的差异
   1. 目标与适用场景
      - Paxos
        - 目的是在不可靠网络上达成任意值的一致性共识（即同意一条提议/日志）。
        - 可用于通用的分布式一致性，比如分布式数据库、日志复制等。
        - 理论性更强，实现更通用，但复杂。
      - ZAB（Zookeeper Atomic Broadcast）/FLE
        - 主要用于Zookeeper，为Zookeeper的主从模式设计。
        - 目标是选举唯一Leader，以及在Leader下进行顺序一致的日志复制。
        - 选举与日志广播一体化，实现为Zookeeper服务量身定制，偏工程实用。
    2. 协议流程上的主要差别
       - Paxos（经典Paxos）
         - 分为Prepare/Promise（第一阶段）、Accept/Accepted（第二阶段），每一条日志都要达成一次共识。
         - 没有Leader角色（或说Paxos Leader只是优化，不是协议本质），理论上每条提议都可以由任意节点提出。
         - 强调每一条决议都独立共识，协议简洁但实现复杂。
       - Zookeeper ZAB/FLE
         - 明确有Leader和Follower角色，Leader负责发起提案，Follower仅投票/同步。
         - 选举Leader用快速选举（FLE），日志同步用ZAB广播。
         - 只有Leader能写数据，Follower只读，适合主从场景。
    3. 一致性保证方式
       - Paxos
         - 通过多数派（quorum）投票、编号（proposal number/ballot/epoch）保证无冲突、无脑裂。
         - 理论上可以支持高并发写，多Leader，但实现难度高。
       - ZAB/FLE
         - 依赖Leader唯一性，所有写都经Leader顺序广播。
         - 只要有多数节点存活+Leader在，保证线性一致性。
         - 不能多Leader写，写入吞吐有限。
    4. 易用性与工程实践
       - Paxos
         - 理论完善，但工程实现难度大（尤其是Multi-Paxos/Generalized Paxos），易出错。
         - 很多系统（如etcd、consul）用Raft替代Paxos，因Raft更易实现和理解。
       - ZAB/FLE
         - 工程上更好落地，Zookeeper的选举和数据同步分离，便于维护。
         - 易于日志回放和Leader恢复。
    5. 易于日志回放和Leader恢复。
       - Paxos每条日志都独立选举一次；ZAB选一次Leader后，所有写日志都由Leader顺序广播。
       - ZAB协议专为Zookeeper设计，选举协议更贴合Zookeeper的数据模型和使用场景。
      
> 总结：
> - Paxos是通用、一致性理论的“祖师爷”，可多Leader、理论更强，但实现复杂。
> - ZAB/FLE是为Zookeeper主从架构定制的，强调唯一Leader、顺序广播，工程实现更直接、实用。
        
5. FLE与ZAB是什么关系？
 - FLE（Fast Leader Election）：Zookeeper内置的Leader选举算法。
   - 作用：保证在集群启动或Leader失效时，能快速选出唯一的新Leader。
   - 本质：只负责谁是Leader，和日志同步与否无关。
  
 - ZAB（Zookeeper Atomic Broadcast）：Zookeeper的分布式一致性协议。
   - 作用：保障Leader和Follower之间数据同步、日志复制和事务一致提交。
   - 包含两大阶段：选举（用FLE） + 原子广播（日志同步和提交）。

关系总结：FLE是ZAB协议中的“选举”子部分，ZAB覆盖了选举+日志同步的全过程。
选Leader时用FLE，Leader产生后，日志复制与一致性保证全靠ZAB的原子广播机制。


















