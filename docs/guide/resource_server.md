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

::: info 现状 现业务采购1000个账户，有不同的部门不同的模块对应的业务系统都需要使用该批资源，业务系统集群部署:::<br>
**目标**：
  1. 将1000个账户根据业务模块及各类业务所需指令数进行合理分配账户，更好的承接业务需求
  2. 实时监控每个账户指令使用情况，动态调整每个模块&系统所分配的账户资源，最大利用账户资源，避免增加额外费用

## 🔧 核心流程与控制点
### 资源系统服务器选举为leader开始流程
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

### 客户端服务器启动与资源系统交互流程
1. 资源系统leader服务器启动时监听模块节点
2. 客户端集群系统（需要使用资源账户的业务系统）启动时会监听所配置的模块节点，并在模块节点下创建临时节点
3. 资源系统leader服务器监听到临时节点后
   - 生成持久化节点的zk路径（临时节点路径 + 固定后缀）
   - 根据持久化节点路径创建zk节点
   - 修改临时节点data值为持久化节点路径
4. 客户端服务器监听到临时节点数据有变化，获取data数据，并监听持久化节点
5. 资源系统leader服务器监听到创建的持久化节点后：
   - 如果是首次启动选举的leader，从pidCollection#pidWithModule#ModuleEnum的`[{instanceVo: List<pidModle>}]`，选取一份`List<pidModle>`批量放入该持久化节点的子路径中，并监听每个pid zk节点
   - 如果是follow转为leader，则将zk节点的数据和pidCollection#pidWithModule（数据库数据）做比较，先做删除，所有实例都删除完成后，再做新增动作，这里使用了PidCollection#instBarrier，初始化值为所有需预分配的实例数量
