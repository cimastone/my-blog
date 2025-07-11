---
title: "资源系统-服务端"
date: 2025-07-09
author: cimaStone
category: "技术架构/资源服务/服务端"
tags: 
  - 技术栈
  - zookeeper
  - redis
---

# 资源系统-服务端
## 🎯 背景与目标
**背景**：业务系统获取业务信息需从第三方平台获取，第三方平台以账户形式进行售卖，业务人员通过账户进行密码登录，输入行业业务指令获取资源数据，也可以通过系统交互的方式进行登录发送指令请求；账户资源有以下要求：
1. 每个账户的发起指令数量有限（数量/月），超出月租数量以阶梯式收费
2. 每个账户同一时间只能在一个终端进行登录，同时在多个终端登录会被中断连接，频繁会使账户资源冻结
3. 业务系统/资源系统都为集群部署，现业务采购1000个账户，有不同的部门不同的模块对应的业务系统都需要使用该批资源

**目标**：
  1. 将1000个账户根据业务模块及各业务所需指令数进行合理分配账户，承接业务需求
  2. 实时监控每个账户指令使用情况，动态调整每个模块&系统所分配的账户资源，最大利用账户资源，避免增加额外费用

## 统一语言
| 名称 | 含义 |
| :---: | :---: |
| pid | 第三方平台的单个账户|
| 资源系统 | 管理、分配和动态调整pid的系统 |
| 客户端 | 需要使用pid的业务系统 |
| 客户端服务器 | 需要使用pid的业务系统#某台服务器 |
| 模块 | 需要使用pid的业务系统所属模块 |
| 通知节点 | 资源系统follow服务器收到pid调度请求时，follow不能操作节点，只能把该请求插入操作记录表，并改动zk通知节点data数据为待处理（DEALING） |

## 🔧 核心流程与控制点
### 资源系统集群服务启动leader服务器启动流程（首次获取leader｜follow -> leader）
1. 需要只有一台服务器的对资源进行分配操作 && 操作zk节点通知客户端，采用zk 选举leader,非leader服务器接收业务操作人员请求后，会将请求内容转换为操作记录表
2. leader服务器被通知成为leader后：
   - 将通知节点对应的data数据改为已处理（DEALED），操作记录表数据改为已处理
   - 设置node属性isLeader == true
   - 清理数据库映射的内存数据（PidCollection#pidWithModule） && zk 映射的内存数据（PidCollection#pidMap）
   - 读取数据库数据初始化内存数据（PidCollection#pidWithModule）
   - 根据模块系统预先设定的服务器数量将分配给该模块的pid集合进行预分批
   - 检查模块路径是否在zk生成节点，已生成则监听，未生成，创建并监听
         
### 客户端服务器启动与资源系统交互流程（客户端zk节点未创建）
1. 资源系统leader服务器启动时监听模块节点
2. 客户端服务器启动时会监听所配置的模块节点，并在模块节点下创建临时节点
3. 资源系统leader服务器监听到临时节点后
   - 生成持久化节点的zk路径（临时节点路径 + 固定后缀）
   - 根据持久化节点路径创建zk节点
   - 修改临时节点data值为持久化节点路径
4. 客户端服务器监听到临时节点数据有变化，获取data数据，并监听持久化节点
5. 资源系统leader服务器监听到创建的持久化节点后，，从数据库映射的内存数据（PidCollection#pidWithModule）选取一份`List<pidModle>`批量放入该持久化节点的子路径中，并监听每个pid zk节点
  
### 客户端服务器启动与资源系统交互流程（客户端zk节点已创建）
1. 资源系统leader服务器启动时监听模块节点
2. 监听到所有模块下的临时节点和持久化节点事件，只处理持久化节点新增事件
3. 将持久化节点（模块）下的List```<Pid>```与数据库映射的内存数据（PidCollection#pidWithModule）进行比较，以数据库映射到的内存数据为准；**先操作服务器zk pid删除，再统一操作新增**，此处使用了CyclicBarrier
4. 当zk节点的数据与数据库映射的内存数据一致时，将数据写入zk 映射的内存数据（PidCollection#pidMap）

### 业务操作人员操作pid同步更新至客户端流程 - leader/follow/客户端处理流程
1. 业务操作人员在页面端操作pid
   - 针对某个模块批量新增/更新/删除pid
   - 将某些pid从A模块下架，在B模块上架
   - 重置pid的指令数量等
2. 请求至资源系统
   - 如果该服务器为leader
     1. 将需要操作的List`<pid>`通过module进行分类，抽出需要删除、新增和更新的列表
     2. 先处理删除数据，更新数据库映射的内存数据（PidCollection#pidWithModule）
     3. 更新zk节点，操作节点成功后更新zk映射的内存数据（PidCollection#pidMap）
     4. 处理新增数据，根据客户端服务器数量进行预分配，更新数据库映射的内存数据（PidCollection#pidWithModule）
     5. 更新zk节点，操作节点成功后更新zk映射的内存数据（PidCollection#pidMap）
     6. 更新List`<pid>`时，则更新数据库映射的内存数据（PidCollection#pidWithModule），更新zk节点，操作节点成功后更新zk映射的内存数据（PidCollection#pidMap）
     7. 全部处理完成后更新数据库数据
   - 如果服务器为follow
      1. 将请求数据转为操作记录表
         - 批量新增/更新/删除：生成同一个批次号的pid操作数据
         - A模块删除，B模块新增：生成同一个批次号的，1条删除数据和1新增数据
      2. 把通知节点改为待处理通知leader服务器，follow服务器返回前端受理成功
      3. leader服务器接收需处理通知，从操作记录表中获取操作数据，后续流程与请求至leader服务器流程一致
      7. leader服务器处理完成后更新通知节点数据为已处理
    ::: tip 服务端/客户端根据zk节点的更新/新增/删除的简易流程
    服务端找到需要在客户端服务器节点上新增pid节点，pid节点data状态值为ADDING -> 客户端服务器接收到新增节点，把新增节点数据获取后放进资源池后，将新增pi节点的状态值改为ADDED -> 服务端后续更新zk 映射的内存数据（PidCollection#pidMap）；更新/删除同理
    :::

### 客户端资源账户指令数同步资源服务器流程 - leader/客户端处理流程
1. 资源系统为集群服务器，需要选举一台服务器负责写和操作zk节点，其它服务器负责读；使用zk选举leader负责写和操作zk
2. 某台服务器被选为leader后，将通知节点对应的data数据改为已处理，因为需要从数据库中重新获取数据装进内存，则表示内存数据与数据库数据一致，设置node属性isLeader == true；这里被选择为leader服务器有两种情况
   - 集群服务器共同启动，通过zab协议选举出的leader，此时instance表没有数据
   - 之前leader服务器down机，某台follow服务器选举为新的leader，此时instance表是有数据的
4. 清理operation表
5. 清理PidCollection#pidMap & PidCollection#pidWithModule
6. 初始化PidCollection#pidWithModule数据
   - 根据depart纬度递层向下初始化，从数据库中后去depart数据，填充id至DepartEnum
   - 从模块表中获取数据填充ModuleEnum
     - 填充id至ModuleEnum
     - 组装moduleEnum的zk路径
     - 模块系统由多少台服务器填充至instCount，并以instCount构建Semaphore对象
     - 获取属于该模块下的List`<pidModel>`，并以pidModel中所归属的instId进行聚合形成集合
       - 如果是首次启动选举的leader,此时该模块所含的List`<pidModel>`中的instId都为null
       - 如果是follow转为leader,此时集合的key是instance表中的ID，当然也可能含有key为null的聚合，极端情况，该模块新增了pidModel，还没有作用到具体的instance时就已经down；这些新增的List`<pidModel>`没有instId
     - 将`<instId: List<pidDTO>>`数据转化为`[{instanceVo: List<pidModle>}]`填充至pidCollection#pidWithModule
   - 根据ModuleEnum#instCount 与`[{instanceVo: List<pidModle>}]` #key的数量进行比较，根据instCount进行均分预分配`List<pidModel>`
     - pidCollection#pidWithModule中的模块下的实例个数 == instCount，不做处理
     - pidCollection#pidWithModule中的模块下的实例个数 == 1 < instCount，均分`List<pidModel>`为instCount份
     - pidCollection#pidWithModule中的模块下的实例个数 == instCount + 1，这多出的1个实例则是没有归属于该模块但未分配给具体实例的`List<pidModel>`；根据instCount分成等份填充至对应的instanceVo所属的资源账户列表中
7. 检查模块路径是否在zk生成节点，已生成则监听，未生成，创建并监听
