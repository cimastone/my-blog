---
title: "第三周"
date: 2026-04-15
author: cimaStone
category: "财务报表"
tags:
  - 折旧/摊销
  - 现金流量表
---

财务报表学习的目的：只是为了让自己做离 money 更近的事情；以 **NVIDIA** 公司为例。

---

## 一、折旧/摊销

### 定义
> 👉 折旧本身不产生现金流，但它通过“税盾（tax shield）”影响现金流，同时真实地减少资产账面价值。

摊销（Amortization / D&A）本质：
  - 是费用（影响利润表）
  - 但不花现金（影响现金流需要加回）
  - 同时减少资产账面价值（影响资产负债表）

> 👉 摊销/折旧永远不等于现金流，它只是“把过去已经发生的现金流，分期体现在利润表中”。

Deferred Income Taxes 本质：
  - 来自 “会计利润 vs 税法利润” 的时间差
  - 常见原因：折旧/摊销口径不同
  - 结果：
    - 税法折旧更快 → 当期少交税 → 形成 递延所得税负债（DTL）（税法费用 < 会计费用 → 少交税 → DTL）
    - 税法折旧更慢 → 当期多交税 → 形成 递延所得税资产（DTA）（税法费用 > 会计费用 → 多交税 → DTA）
   
> 👉 Deferred Tax = 会计确认节奏 vs 税务确认节奏的差异。
   
### 例子

#### 假设
  - 初始资产：100（无残值）
  - 会计摊销：直线法 3年，每年 33.3
  - 税法摊销：加速
    - 第1年：50
    - 第2年：30
    - 第3年：20
  - 税率：25%
  - 每年收入：200
  - 其他现金成本：100

#### 逐年拆解：

**▶ 第1年**

1️⃣ 利润表（Income Statement）
  - 收入：200
  - 成本：100
  - 摊销（会计）：33.3
  - 税前利润：66.7

税务角度：
  - 税法摊销：50
  - 应税利润 = 200 - 100 - 50 = 50
  - 应交税 = 50 × 25% = 12.5

会计税：
  - 会计利润 × 25% = 16.7

👉 差额 = 16.7 - 12.5 = 4.2（递延税）

2️⃣ 现金流量表（Cash Flow Statement）

从净利润出发：
  - 净利润 = 66.7 - 16.7 = 50

调整：
  - 摊销（非现金）：+33.3
  - 递延税（DTL增加）：+4.2

👉 CFO = 87.5

3️⃣ 资产负债表（Balance Sheet）

  - 无形资产/固定资产：
    - 100 → 66.7（减少33.3）
  -递延所得税负债（DTL）：
    - +4.2

**▶ 第2年**

1️⃣ 利润表
  - 摊销（会计）：33.3
  - 税法摊销：30

税务差异：
  - 会计利润：66.7
  - 应税利润：70
  - 应交税：17.5
  - 会计税：16.7

👉 本年递延税 = -0.8（DTL回转）

2️⃣ 现金流量表
  - 净利润：50
  - 摊销：33.3
  - 递延税（负）：-0.8

👉 CFO ≈ 82.5

3️⃣ 资产负债表
  - 资产：66.7 → 33.4
  - DTL：4.2 → 3.4

**▶ 第3年**

1️⃣ 利润表
  - 摊销（会计）：33.3
  - 税法摊销：20

税务：
  - 应税利润：80
  - 应交税：20
  - 会计税：16.7

👉 递延税 = -3.3（继续回转）

2️⃣ 现金流量表
  - 净利润：50
  - 摊销：33.3
  - 递延税：-3.3

👉 CFO = 80

3️⃣ 资产负债表
  - 资产：33.4 → 0
  - DTL：3.4 → 0（完全释放）

### 折旧摊销的场景

#### 场景A：一次性买资产（走 CFI）

👉 对应字段：
CFI – Purchases related to property and equipment and intangible assets
  - 第一年直接付现金100
  - 后面不再有本金现金流
  - 只有折旧/摊销（非现金）

**开始买资产：**
现金流量表：
  - CFI：
    - -100（买资产）

资产负债表：
  - 无形资产/固定资产：
    - 100 

**第一年：**
资产负债表
  - 无形资产/固定资产：
    - 100 → 66.7（减少33.3）
  -递延所得税负债（DTL）：
    - +4.2

``` bash
买资产 → CFI -100
        ↓
资产入表100
        ↓
每年折旧（利润表）
        ↓
折旧加回（CFO）
        ↓
税法不同 → DTL
```

**如果看到：**
  - CFO很高
  - 但CFI很大负数

👉 说明：公司在持续投入资产（资本开支）


#### 场景B：融资租赁（走 CFF）

👉 对应字段：
CFF – Principal payments on property and equipment and intangible assets
  - 第一年不一定付100现金
  - 资产+负债同时入表（类似“贷款买资产”）
  - 之后每年还本金（CFF流出）
  - 同样有折旧/摊销（非现金）

**开始融资租赁资产**

资产负债表：
  资产净值：+100
  租赁负债：+100

**第一年**

现金流量表
  - CFF：-33.3 **逐年递减33.3**
      
资产负债表
  - 资产净值：100-33.3
  - 租赁负债：100-33.3 **逐年递减33.3**

```bash

不付现金拿资产
        ↓
资产+负债
        ↓
每年折旧（利润表）
        ↓
每年还本金（CFF）
        ↓
同样有DTL

```

**如果看到：**
  - CFO不错
  - CFF里大量 Principal Payments

👉 说明：公司在“还设备/租赁的钱”（融资驱动资产）


### 资产净值

✅ 正确结构（一定要分清）

对于固定资产（PP&E），报表里其实有三层：

```bash
Gross PP&E（原值，cost）
- Accumulated Depreciation（累计折旧）
= Net PP&E（净值）
```

<img width="1425" height="562" alt="image" src="https://github.com/user-attachments/assets/8a91773f-96d8-49c6-97fe-82971cb7766d" />
**图片标红的是资产净值** Property and equipment, net = 10,383 是已经扣完累计折旧之后的结果（净值）


**折旧真实减少账面价值**

因为每年：
```code
累计折旧 ↑
→ 净值 ↓
→ 资产 ↓ 资产价值 = 尚未被费用化的成本
```

**真实世界逻辑**

```code
期末净值
= 期初净值
+ Capex
- 折旧
```

| 概念                 | 含义       |
| ------------------ | -------- |
| 账面价值（Book Value）   | 会计规则算出来的 |
| 市场价值（Market Value） | 真实能卖多少钱  |


这块容易有个比较大的疑问，比如说有个厂房，100w，分摊三年
  - 三年内在资产负债表中体现的是这个厂房的净值（去除摊销后的价值）
  - 三年后，在资产负债表中是看不到这个厂房的价值

**那财报是不是“失真了”？**

👉 是的，但这是“有意设计的”

**▶ 会计的目标不是“估值”**

而是：

> 保证利润的匹配（matching principle）

即：👉 花100万 → 分摊到3年利润里

**▶ 会计刻意不做这件事：**
> ❌ 不持续更新资产市场价值

因为：
  - 主观性太强
  - 可操纵性太高
  - 审计难度极大

**所以会出现一个非常重要的现象**

🔴 “隐形资产”（Undervalued assets）

比如：
  - 老厂房（已折旧完）
  - 早期买的土地（大幅升值）
  - 老设备（仍在使用）

👉 在报表中：价值 ≈ 0

但现实中：可能非常值钱

**那什么时候才“显现价值”？**

情况1：卖掉

```code
假设卖 80 万：

账面价值 = 0
卖价 = 80
→ 利润 = 80（一次性gain）
```
👉 这时候价值才“被确认”

情况2：减值（反方向）

如果资产不值钱了：👉 会提前降值（impairment）

### 总结

🔴 1️⃣ 资产
```code
你看到的：
Property & Equipment, net

本质：
已经扣完折旧的“剩余价值”
```


🔴 2️⃣ 折旧
```code
影响三张表：

利润表：费用
现金流：加回
资产负债表：减少净值
```


🔴 3️⃣ 递延税
```code
来源：
会计折旧 ≠ 税法折旧

结果：
形成 DTA 或 DTL（累计值）
```

## 二、SBC && 递延税

SBC对应的税务处理有一个典型结构：
  - 会计上：费用逐期摊销（GAAP expense）
  - 税务上：通常在行权/归属时才允许扣除（tax deduction）

👉 所以产生：
  - 早期：会计费用 > 税务扣除 → DTA（递延所得税资产）
  - 后期（行权扣税时）：DTA reverse

> 它和摊销是相反的，摊销是第一年税扣的少，形成税负债；而SBC是第一年税扣的多，形成税资产


### 例子

#### 假设
  - 公司授予员工期权
  - 总公允价值（grant date fair value）：120，每年40
  - 归属期：3年直线摊销
  - 税法规定：只有在行权时才允许税前扣除
  - 税率：25%
  - 行权发生在第4年末

#### 逐年拆解：

**▶ 第1年**

1️⃣ 利润表（Income Statement）
  - 收入：200
  - 成本：100
  - 摊销（会计）：40
  - 税前利润：60

税务角度：
  - 税法摊销：0
  - 应税利润 = 200 - 100 = 100
  - 应交税 = 100 × 25% = 25

会计税：
  - 会计利润 × 25% = 15

👉 差额 = 15 - 25 = -10（递延税）

2️⃣ 现金流量表（Cash Flow Statement）

从净利润出发：
  - 净利润 = 60 - 15 = 45

调整：
  - 摊销（非现金）：+40
  - 递延税（DTA增加）：-10

👉 CFO = 75

3️⃣ 资产负债表（Balance Sheet）

  - 递延所得税负债（DTA）：
    - +10
  - APIC：
    - +40
  
**▶ 第2年**

1️⃣ 利润表
  - 摊销（会计）：40
  - 税法摊销：0

税务差异：
  - 会计利润：60
  - 应税利润：100
  - 应交税：25
  - 会计税：15

👉 本年递延税 = -10（DTA新增）

2️⃣ 现金流量表
  - 净利润：45
  - 摊销：40
  - 递延税（负）：-10

👉 CFO ≈ 75

3️⃣ 资产负债表
  - 递延所得税负债（DTA）：
    - +10 -> +20
  - APIC：
    - +40 -> +80

**▶ 第3年**

1️⃣ 利润表
  - 摊销（会计）：40
  - 税法摊销：0

税务差异：
  - 会计利润：60
  - 应税利润：100
  - 应交税：25
  - 会计税：15

👉 本年递延税 = -10（DTA新增）

2️⃣ 现金流量表
  - 净利润：45
  - 摊销：40
  - 递延税（负）：-10

👉 CFO ≈ 75

3️⃣ 资产负债表
  - 递延所得税负债（DTA）：
    - +10 -> +30
  - APIC：
    - +80 -> +120
   
**▶ 第4年行权**

假设：营业收入400，成本100
1️⃣ 利润表
  - 摊销（会计）：0
  - 税法摊销：120

税务差异：
  - 会计利润：300
  - 应税利润：180
  - 应交税：75
  - 会计税：45

👉 本年递延税 = -30（DTA减少）

2️⃣ 现金流量表
  - 净利润：225
  - 摊销：0
  - 递延税（负）：+30

👉 CFO ≈ 255

3️⃣ 资产负债表
  - 递延所得税负债（DTA）：
    - +30 -> 0
  - APIC：
    - +120 -> +120
   
  其实现实情况下，这里会更加复杂，因为税务的金额是按当时行权时的市价进行计算的，费用的计算是按期权的公允机制计算的，而填充股本+apic使用的期权行权的价格；当然这里还涉及到了RSU，RSU没有行权价格；还有RS；每个环节计算的价格都不太一样；所有期权的话容易

因为费用计算价格和税务使用的市价差别较大，所以容易形成excess tax benefit；这个金额计入在APIC中；

RSU

  | 维度      | 用什么             |
| ------- | --------------- |
| 会计费用    | grant value（10） |
| 股本/APIC | grant value     |
| 税务      | 市价（15）          |

Option：

| 维度      | 用什么              |
| ------- | ---------------- |
| 会计费用    | Black-Scholes（6） |
| 股本/APIC | strike + SBC     |
| 税务      | (市价 - strike)    |


## 三、CF#Changes in Working Capital(营运资金变化)

<img width="1428" height="221" alt="image" src="https://github.com/user-attachments/assets/c6b09ebf-5479-4814-b951-e4f94b4bd3db" />
<img width="1430" height="691" alt="image" src="https://github.com/user-attachments/assets/6f99ee83-b1e6-4d0e-82f2-2e2c174fc2e3" />

从上面的图片我们就能看出，营运资金变化是基于资产负债表中的现金变化部分进行调整的到CFO；同时注意现金流量表中包含**net of acquisitions**


| 科目      | 现金流量表值              | 近两年差值     | 调整逻辑     |
| ------- | ---------------- |----------------------|----------------------|
| Accounts receivable    | (15,399)		 | (15,399)		|由资产负债表中的近两年的差值得出的，今年比去年的多，现金流需把新增部分去除|
| Inventories            | (11,324)    | (11,324)		|由资产负债表中的近两年的差值得出的，今年比去年的多，现金流需把新增部分去除|
| Prepaid expenses and other assets | 577 | 591     |差值通常体现在汇率 or small reclass|
| Accounts payable       | 3096        | 3502     | 并购 && 汇率（NVDA全球业务）|
| Accrued and other current liabilities | 5,257 | 9615 | 见下面说明 |
| Other long-term liabilities | 1844 | 3061     | 见下面说明 |


### Accrued and other current liabilities

✅（1）包含大量“非经营性项目”

这个科目通常包括：
  - 应付工资/奖金
  - 应计费用
  - 税费
  - 利息
  - SBC相关负债（重点）
  - 甚至衍生负债

👉 其中很多：
> ❌ 不属于operating working capital
> ❌ 不进CFO这一行

✅（2）SBC

NVDA这几年：
👉 SBC规模非常大

会带来：
  - BS：Accrued liabilities ↑（比如应付薪酬）
  - CFO：不会作为working capital调整

因为：

> SBC已经在：
>   - 净利润里扣了
>   - 又在CFO里加回了（non-cash）

👉 如果这里再算一遍，就重复计算

✅（3）所得税相关负债
  - Deferred tax / income tax payable
  - 👉 也可能被拆到其他行

✅（4）重分类

有些负债：
  - 从current → non-current
  - 👉 BS有变动，但CFO不认

### SBC在资产负债表形态

1️⃣ 授予时（Grant date）
  - 不记负债
  - 不影响现金
  - 不进资产负债表

2️⃣ 服务期内（逐步确认费用）

假设员工分4年归属：

每年确认：
  - Dr：SBC费用（利润表）
  - Cr：APIC（股东权益）

👉 注意这里：
> ✔ 直接进权益（APIC）
> ❌ 不是负债（这是最核心点）

3️⃣ 那为什么会出现在Accrued liabilities？

👉 因为“时间差”和“结算机制”

可能出现两种情况：

✅ 情况A：已确认费用，但还没真正发股/结算

比如：
  - 工资周期末
  - RSU已服务但还没发股票

会暂时记：
  - Cr：Accrued compensation（负债）

之后：
  - 发股时 → 转去APIC

👉 所以你看到：
> Accrued and other current liabilities ↑

✅ 情况B：税务代扣（非常重要）

RSU vest时：

公司会：
  - 代员工缴税（withholding tax）

会产生：
  - 应付税（liability）

👉 也会进：
  > Accrued liabilities / other current liabilities

### Other long-term liabilities

✅（1）非经营性负债

这个科目通常包含：
  - long-term tax liabilities
  - lease liabilities
  - deferred revenue（部分）
  - pension等

👉 很多：
> ❌ 属于融资 / 非经营
> ❌ 不进CFO working capital

✅（2）融资租赁

如果有：
  - lease liability增加

👉 会：
  - 进CFF（principal payment）
  - 不进CFO working capital

```code

CFO营运资本变动
= ΔBS
− 并购影响
− 汇率
− 非现金项目（SBC / D&A / revaluation）
− 非经营项目（税 / 融资 / lease）
− 重分类

```

## 三、RSU整条链路

### 总框架

```code

Grant → 服务期确认费用 → Vest（归属） → 扣税 → 发股

```
对应三张表：
  - 利润表：SBC expense
  - 现金流量表：加回 + 税务影响
  - 资产负债表：APIC / Tax payable / Deferred tax

### 第一步：SBC费用是怎么来的?

公司在授予时就确定一个grant-date fair value（比如100）

然后在服务期内摊：
```code
Dr SBC expense
Cr APIC
```

👉 关键点：
  - ✔ 不涉及现金
  -  ✔ 不进负债（大方向）
  - ✔ 直接进权益（APIC）

### 第二步：Deferred Tax

SBC会带来税会差异（book vs tax）

**会计（book）**

按授予日公允价值确认费用（比如100）

**税务（tax）**

👉 按归属时的股票市价扣税（比如150）

**结果：**
```code
tax deduction（150） > book expense（100）
```

👉 产生：**① 递延所得税资产（DTA）**

在服务期内确认：
```code
Dr DTA
Cr Tax benefit（减少所得税费用）
```

### 第三步：RSU归属（核心节点）

到了vest date：

假设：
  - grant value：100
  - vest时股价：150
  - 税率：25%

**税务实际发生：**

公司可以抵税：
```code
150 × 25% = 37.5
```

但账上之前只确认了：
```code
100 × 25% = 25
```

差额：
```code
37.5 - 25 = 12.5 (Excess Tax Benefit)
```

### 第四步：Excess Tax Benefit 到底去了哪里？

现在规则（ASC 718之后）：

**👉 直接进CFO**

会计处理：
```code
Dr Cash（或减少税款）
Cr Income tax payable
```

同时：
```code
差额（12.5）
→ 直接体现在CFO（operating cash inflow）
```
👉 不再进APIC（老准则才进）

### 第五步：APIC到底怎么变？

1️⃣ 服务期内
```code
Cr APIC（累计100）
```

2️⃣ 发股时（RSU vest）

公司会：
  - 发股票（equity增加）
  - 同时：👉 不会再额外影响APIC（因为之前已经记过）

3️⃣ 税务代扣（关键）

员工要交税，公司代扣：

比如：
  - 股票价值150
  - 税：37.5

公司通常：

👉 不给员工全部股票

👉 留一部分卖掉交税（net settlement）


会计：
```code
Dr APIC（或减少equity）
Cr Cash（交税）
```

👉 这一步：
  - 会影响equity结构
  - 也可能影响你看到的liability（短期应付税）

### 第六步：现金流量表

现在把所有东西放进CFO：

**起点：Net Income**

已经包含：
  - SBC expense（-100）
    
**CFO调整：**
① 加回SBC（非现金）： +100

② Working capital
  - Accrued liabilities里如果有SBC相关
    
👉 ❌ 不重复算

③ 税务现金流（重点）

当RSU vest：

公司实际：
  - 交税（现金流出）

但：👉 tax deduction更大（150）

**最终效果：**

👉 CFO通常是：+ Excess tax benefit（12.5）

### 第七步： 为什么RSU“几乎总是excess tax benefit”？

**原因一：科技股上涨**

NVDA这种公司：

```code
vest时股价 >> grant时股价
```

👉 tax deduction > book expense

👉 几乎必然：

✔ excess tax benefit

**原因二：RSU没有行权价**

期权（Option）：
```code
tax deduction = max(0, 股价 - strike)
```

👉 有可能：股价 < strike → 没有tax benefit

RSU：
```code
tax deduction = 股价（全额）
```

👉 永远有

👉 且通常更大

**理解图**

```code
SBC费用 ↓ Net Income
        ↑ CFO加回

RSU升值 → tax deduction ↑
        → Excess tax benefit ↑ CFO

Accrued liabilities ↑（含SBC/税）
        → CFO中剔除（避免重复）
```

## 四：CFI && CFF 利息收入/支出/价格变动

```code
1. 这笔收益有没有进利润表？
   → 有 → CFO要剔除

2. 这笔现金是不是投资行为？
   → 是 → 放CFI

3. 是利息还是价格变动？
   → 利息 → CFO
   → 价格变动 → CFO剔除 + CFI体现现金
```
