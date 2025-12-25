# IMVU Insight 数据结构与分层设计说明

## 1. 文档目的

本文档用于说明 **IMVU Insight 项目中数据结构的整体设计思路与分层原则**，明确：

- 各数据层的职责边界
- Raw / Core / Analytics 各层允许与禁止的行为
- XML 原始数据如何演进为业务对象与统计分析结果

本设计旨在支持：
- 可回溯的数据导入
- 可重建的业务模型
- 长期可演进的数据分析能力

---

## 2. 核心设计结论（先给结论）

### 2.1 分层总体原则

> **Raw 就是 Strict Raw，不存在独立的 Staging Raw 层。**  
>  
> - Raw 层：只对“事实”负责  
> - Core 层：对“业务语义”负责  
> - Analytics 层：对“如何分析与展示”负责  

所有 **字段合并、语义推断、业务抽象**，只能发生在 Core 层及其之后。

---

## 3. 数据整体分层结构

整体数据流转路径如下：

```text
XML 文件
↓
data_sync_records（原始文件留存，Binary Raw）
↓
Raw Tables（Strict Raw，XML 镜像表）
↓
Core / Biz Tables（业务对象层）
↓
Analytics（视图 / 统计表）
```


---

## 4. Raw 层设计原则（Strict Raw）

### 4.1 Raw 层的定义

Raw 层是 **XML 原始数据的结构化镜像**，其唯一目标是：

> **让 XML 中的每一个 attribute，都可以被 SQL 查询到**

Raw 层不表达任何业务观点，也不承担业务理解。

---

### 4.2 Raw 层的铁律

#### ✅ Raw 层允许的行为

- XML attribute 与数据表字段 **1:1 映射**
- 字段名允许规范化（如 `snake_case`）
- 保留 XML 中的原始取值形式（字符串 / 数字字符串 / Y/N / 空字符串）
- 增加**技术性字段**：
  - `sync_record_id`（来源文件）
  - `snapshot_date`（导入快照日期）
  - `created_at`

#### ❌ Raw 层绝不允许的行为

- 合并字段（如多个金额字段合成 amount）
- 推断新字段（如 is_gift、is_active）
- 改变语义（如 visible='Y' → boolean）
- 丢弃 XML 中存在的 attribute
- 使用业务命名（如 transaction_id、amount、income）

---

### 4.3 Raw 层的定位总结

> **Raw 是事实，不是观点。**  
>  
> Raw 层只回答一个问题：  
> **“IMVU 当时给了我什么数据？”**

---

## 5. data_sync_records 的角色定位

项目中已存在的 `data_sync_records` 表，承担以下职责：

- 原始 XML 文件的持久化留存（`content`）
- 文件级别的幂等控制（`hash`）
- 导入批次与 Raw 数据之间的关联

因此：

> `data_sync_records` 等同于 **Raw File Meta / Binary Raw**  
> Raw 表通过 `sync_record_id` 反向关联具体文件。

---

## 6. Core / Biz 层设计原则

### 6.1 Core 层的定义

Core 层是系统对 Raw 数据的**第一次业务理解结果**，用于表达：

- 什么是一个用户
- 什么是一个商品
- 什么是一笔交易

Core 层中的数据应当：
- 语义清晰
- 结构稳定
- 可被前端与业务逻辑直接使用

---

### 6.2 Core 层允许的行为

- 字段合并（如金额字段整合）
- 语义推断（如 is_gift）
- 统一命名（如 transaction_id）
- 外键关系建立（user / product / developer）
- 去重、校验、规范化

### 6.3 Core 层的来源约束

> **Core 层的所有数据，必须可追溯到 Raw 层。**

Core 层不是“人工编辑数据”，而是 **可重复计算的结果层**。

---

## 7. Analytics 层设计原则

### 7.1 Analytics 层的定义

Analytics 层用于支持：

- 统计分析
- 趋势分析
- Dashboard / 图表展示
- 排名、汇总、对比

### 7.2 实现方式

Analytics 层可以通过以下方式实现：

- SQL View（优先，轻量、可维护）
- 物化统计表（在数据量或性能需要时）

Analytics 层的数据：
- **不作为事实来源**
- **可随时删除并重新生成**

---

## 8. 关于用户与角色的统一认知

在 IMVU 平台中：

- Developer
- Buyer
- Recipient
- Reseller

**本质上都属于同一类实体：IMVU User**

它们的差异只体现在 **业务上下文中的角色**，而非身份本体。

因此：

- Raw 层保留各类 user_id 原始字段
- Core 层统一抽象为 `imvu_user`
- 角色语义仅存在于具体业务关系中

---

## 9. 设计哲学总结

本项目采用的核心设计哲学是：

> **事实与观点分离**  
> **历史与当前分离**  
> **存储与分析分离**

一句话总结：

> **Raw 层负责“我看到了什么”，  
> Core 层负责“我理解这是什么”，  
> Analytics 层负责“我想怎么看”。**

---

## 10. 设计取舍说明

本项目明确 **不引入独立的 Staging Raw 层**，原因包括：

- 已保留完整原始 XML 文件
- 项目规模与复杂度不需要额外过渡层
- 简化心智模型，避免层级语义混乱
- 强化 Raw 与 Core 的责任边界

如未来需求变化，可在不破坏现有 Raw / Core 的前提下扩展。

---

## 11. 后续实施顺序建议

推荐的实施顺序为：

1. 定义并锁定 Strict Raw 表结构（完全对齐 XML）
2. 实现 XML → Raw 的解析与导入
3. 设计并实现 Core 层业务表
4. 构建 Analytics 视图或统计表
5. 前端与 API 基于 Core / Analytics 层对接

---

**本文档为架构级设计说明，  
具体表结构与实现细节请参考对应模块文档与代码。**
