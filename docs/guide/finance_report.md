---
title: "财务报表学习总结"
date: 2026-03-30
author: cimaStone
category: "财务报表/第一周"
tags: 
  - 利润表
  - 资产负债表
  - 现金流表
---

财务报表学习的目的只是为了让自己做离money更近的事情；以NVIDIA公司为例

***

利润表
<img width="1431" height="689" alt="image" src="https://github.com/user-attachments/assets/03837bde-02f2-47e5-b885-a756e3758059" />

**说明：** ：👉 这个财年周期 看“赚不赚钱”

**结构逻辑：**
> 收入 → 成本 → 毛利润 → 费用 → 净利润

**重点关注：**
  * 毛利率（产品是否有竞争力）
  * 净利润（最终赚多少）

**关键能力：**
  * 判断公司盈利能力
  * 分析利润来源是否健康

**关键科目：**
| 科目 | 含义 | 特别说明 |
|------|------|----------|
| Revenue | 公司总收入 | 看增长（YoY）最重要 |
| Cost of Revenue | 直接成本 | 用来算毛利 |
| Gross Profit | 毛利润 | = 收入 - 成本 |
| R&D | 研发费用 | 科技公司高是好事 |
| SG&A | 销售管理费用 | 反映运营效率 |
| Operating Expenses | 总运营费用 | = R&D + SG&A |
| Operating Income | 营业利润 | ⭐ 核心盈利能力（不含利息） |
| Interest Income | 利息收入 | 非主营 |
| Interest Expense | 利息支出 | 看负债成本 |
| Other Income | 其他收入 | 常有一次性波动 |
| Income Before Tax | 税前利润 | 综合利润 |
| Income Tax | 所得税 | 税率变化要注意 |
| Net Income | 净利润 | 最终利润（但不最“干净”） |
| EPS | 每股收益（净利润/总股数） | 投资常用 |

---

资产负债表
<img width="1438" height="567" alt="image" src="https://github.com/user-attachments/assets/e62e339e-3d71-4e0d-a4a7-02ae2461948c" />
<img width="1432" height="560" alt="image" src="https://github.com/user-attachments/assets/66adb336-6450-4050-b30a-71ab3ec2d766" />

**说明：** 👉 看当前公司总的 “家底”和“欠债”

**核心公式：**
  > 资产 = 负债 + 所有者权益

**重点理解：**
  * 资产：公司有什么（现金、存货、设备）
  * 负债：欠了谁的钱（借款、应付账款）
  * 所有者权益：股东的钱

**关键能力：**
  * 判断公司“稳不稳”（偿债能力）
  * 看负债是否过高（财务风险）

**关键科目：**
| 科目 | 含义 | 特别说明 |
|------|------|----------|
| Cash & Equivalents | 现金 | 安全性最高，现金流表中的Cash and cash equivalents at end of period |
| Marketable Securities | 短期投资 | 类似理财 |
| Accounts Receivable | 应收账款 | 用来算 DSO |
| Inventory | 存货 | 用来算 DIO |
| Prepaid expenses and other current assets | 预付费用及其他流动资产 | 已经付钱但未来才确认费用（如房租、保险）；过高可能影响现金利用效率 |
| Property & Equipment | 固定资产 | 重资产公司高 |
| Operating lease assets | 使用权资产（租赁资产） | 新会计准则下确认的“租来的资产”；要和租赁负债一起看 |
| Goodwill | 商誉 | 并购溢价形成；过高需警惕减值风险（虚胖资产） |
| Intangibles | 无形资产 | 专利、品牌 |
| Deferred income tax assets | 递延所得税资产 | 未来可以少交税；本质是“税收优惠的存量” |
| Non-marketable equity securities | 非上市股权投资 | 投资未上市公司；估值不透明，波动可能影响利润 |
| Other assets | 其他资产 | 杂项科目；占比过高要警惕“藏东西” |
| Total Assets | 总资产 | 公司规模 |
| Accounts Payable | 应付账款 | 用来算 DPO |
| Accrued and other current liabilities | 应计及其他流动负债 | 已发生但未支付（工资、费用）；是“隐性负债” |
| Long-term operating lease liabilities | 长期租赁负债 | 与使用权资产对应；本质类似债务，要计入杠杆分析 |
| Debt | 债务 | 分短期/长期 |
| Deferred Revenue | 递延收入 | ⭐ 先收钱（优质） |
| Total Liabilities | 总负债 | 风险指标 |
| Shareholders’ Equity | 股东权益 | 用来算 ROE |
| Preferred stock, $0.001 par value; 2 shares authorized; none issued | 优先股 | 给到投资人，能优先分红，破产优先清算但无投票权；面值$0.001, 允许发行2股，但是没有发行 |
| Common stock, $0.001 par value; 80,000 shares authorized; 24,304 shares issued and outstanding as of January 25, 2026; 24,477 shares issued and outstanding as of January 26, 2025 | 普通股 | 面值$0.001,允许发行80,000股，2026.1.25 总股本和流通股有24,304股， 2026.1.26 总股本和流通股有24,477股 |
| Additional paid-in capital | 股东真正投的钱 | APIC=（发行价−面值）×股数 |
| Accumulated other comprehensive income | 非主营浮动 | “不进利润表”的收益/损失，包括外汇变动、投资浮盈（部分）、对冲工具 |
| Retained earnings | 公司帮股东赚的钱（没分走） | 期末留存收益=期初留存收益+净利润−分红 |


---

现金流量表
<img width="1431" height="569" alt="image" src="https://github.com/user-attachments/assets/65033251-e4f5-4be7-a98b-2a6af9b11013" />
<img width="1431" height="684" alt="image" src="https://github.com/user-attachments/assets/e8098d4d-d062-4661-b50a-3ae22642757a" />

**说明：** 👉 这个财年 看“钱是不是真的进来了”

**三大部分：**
  * 经营活动现金流（最重要）
  * 投资活动现金流
  * 融资活动现金流

**关键能力：**
  * 防止“账面赚钱但没现金”的公司
  * 判断企业是否可持续

**关键科目：**
| 科目 | 含义 | 特别说明 |
|------|------|----------|
| Net Income | 净利润 | 起点（非现金）- 利润表中的净利润 |
| Stock-Based Compensation | 股权激励 | Adjustments to reconcile net income to net cash provided by operating activities#不花现金但会稀释 |
| Depreciation & Amortization | 折旧摊销 | Adjustments to reconcile net income to net cash provided by operating activities#要加回（非现金） |
| Gains on non-marketable & publicly-held equity securities, net | 股权投资收益（含未上市和上市） | Adjustments to reconcile net income to net cash provided by operating activities#非主营收益；波动大，不能当“稳定赚钱能力” |
| Deferred income taxes | 递延所得税 | Adjustments to reconcile net income to net cash provided by operating activities#非现金项目；用于调节利润与现金流差异 |
| Accounts receivable | 应收账款但未到账 | Changes in operating assets and liabilities, net of acquisitions#根据近两年的差值进行计算 |
| Inventories | 库存 | Changes in operating assets and liabilities, net of acquisitions#根据近两年的差值进行计算 |
| Prepaid expenses and other assets | 预付费用及其他流动资产 | Changes in operating assets and liabilities, net of acquisitions#根据近两年的差值进行计算 |
| Accounts payable | 应付账款 | Changes in operating assets and liabilities, net of acquisitions#根据近两年的差值进行计算 |
| Accrued and other current liabilities | 应计负债变动 | 增加→现金流入（拖付款）；减少→现金流出 |
| Other long-term liabilities | 其它长期负债 | 增加→现金流入（拖付款）；减少→现金流出 |
| Changes in Working Capital | 营运资金变化 | ⭐ 现金流核心变量，这边主要是针对Changes in operating assets and liabilities, net of acquisitions科目内容 |
| Operating Cash Flow | 经营现金流 | net income -> ocf通过Adjustments to reconcile和Changes in Working Capital进行调整；去掉非现金和非经营现金活动 |
| Capex | 资本开支 | 设备（GPU、服务器等）、厂房、数据中心，属于Cash Flow from Investing Activities（CFI）#Purchases of property and equipment |
| Free Cash Flow | 自由现金流 | = OCF - Capex |
| Share Repurchase | 股票回购 | 利好股东 |
| Debt Issuance | 借债 | 现金流入 |
| Debt Repayment | 还债 | 现金流出 |





---

二、三表之间的关系（必须掌握）

这是很多人卡住的关键点👇
  * 利润表的“净利润” → 进入资产负债表（留存收益）
  * 现金流量表 → 调整利润（把“账面利润”变成“真实现金”）
  * 三张表是一个闭环系统

👉 一句话理解：
** 利润表讲故事，资产负债表是结果，现金流量表验证真假 **


三、核心财务指标：

| 指标 | 公式 | 核心意义 | 趋势 | 描述
|------|------|----------|------|------|
| ROE（Return on Equity） | 净利润 / 平均股东权益 | 赚钱能力 | 越高越好 | Income#Net income / Balance Sheets#Total shareholders' equity（平均股东权益 =（上一年 + 这一年）/2）
| 资产负债率（Debt-to-Asset Ratio） | 总负债 / 总资产 | 风险水平 | 适中最好 | Balance Sheets#Total liabilities / Balance Sheets#Total assets
| 负债股东权益比率（Debt-to-Equity Ratio） | 总负债 / 股东权益 | 负债与股东权益的比例，衡量资本结构 | 越低越好 | 过高的比例表示公司可能依赖债务进行融资，股东权益相对较少，可能面临财务风险。
| 流动比率（Current Ratio） | 流动资产 / 流动负债 | 短期偿债能力 | ≈2最好 | Balance Sheets#Total current assets / Balance Sheets#Total current liabilities
| 存货周转率（Inventory Turnover Ratio） | 营业成本 / 平均存货 | 卖货速度 | 越高越好 | Income#Cost of revenue / Balance Sheets#Inventories （平均存货 =（上一年 + 这一年）/2）
| DIO（存货周转天数 - Days Inventory Outstanding） | 365 / 存货周转率 | 库存占用时间 | 越低越好 | 365/ 存货周转率
| 应收账款周转率（Accounts Receivable Turnover Ratio） | 营业收入 / 平均应收账款 | 收钱速度 | 越高越好 | Income#revenue / Balance Sheets#Accounts receivable, net （平均应收账款 =（上一年 + 这一年）/2）
| DSO（回款天数 - Days Sales Outstanding） | 365 / 应收账款周转率 | 收款周期 | 越低越好 | 365 / 应收账款周转率
| DPO（应付账款周转天数 - Days Payable Outstanding） | 365 / (营业成本 / 平均应付账款) | 占用供应商资金时间 | 越高越好 | 365 / （Income#Cost of revenue / Balance Sheets#Accounts payable （平均应付账款 =（上一年 + 这一年）/2 ））
| CCC（现金转换周期） | DIO + DSO - DPO | 现金周转效率 | 越低越好（甚至为负最好） | DIO + DSO - DPO
| Cash Conversion Ratio（Earnings Quality Ratio、Cash Conversion） | CFO / Net Income | 利润转化为现金的能力 | ≈1或>1最好 | 看利润是否“虚”
| Operating Cash Flow Margin （CFO Margin）| CFO / Revenue | 收入转化为经营现金能力 | 越高越好 | 现金赚钱能力
| Free Cash Flow Margin（FCF Margin） | FCF / Revenue | 收入转化为自由现金能力 | ⭐核心指标 | 看公司“赚钱质量”
| FCF Conversion Ratio（Cash Earnings Ratio） | FCF / Net Income | 净利润转化为自由现金能力 | 越高越好 | 看“最终能留下多少钱”
