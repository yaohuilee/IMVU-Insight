# IMVU Insight 數據結構與分層設計說明

## 1. 文件目的

本文檔說明 IMVU Insight 項目中數據結構的整體設計思路與分層原則，明確：

- 各數據層的職責邊界
- Raw / Core / Analytics 各層允許與禁止的行為
- XML 原始數據如何演進為業務對象與統計分析結果

本設計旨在支持：
- 可回溯的數據導入
- 可重建的業務模型
- 長期可演進的數據分析能力

---

## 2. 核心設計結論（先給結論）

### 2.1 分層總體原則

> Strict Raw，即不引入獨立的 Staging Raw 層。
>
>- Raw 層：僅負責「事實」
>- Core 層：負責「業務語義」
>- Analytics 層：負責「如何分析與展示」

所有字段合併、語義推斷、業務抽象，必須發生在 Core 層及其之後。

---

## 3. 數據整體分層結構

數據流轉路徑如下：

```text
XML 檔案
↓
data_sync_records（原始檔案留存，binary raw）
↓
Raw tables（Strict Raw，XML 鏡像表）
↓
Core / Biz Tables（業務對象層）
↓
Analytics（視圖 / 統計表）
```

---

## 4. Raw 層設計原則（Strict Raw）

### 4.1 Raw 層的定義

Raw 層是 XML 原始數據的結構化鏡像，其唯一目標是：

> 讓 XML 中的每一個 attribute 都可以被 SQL 查詢到。

Raw 層不表達任何業務觀點，也不承擔業務理解。

---

### 4.2 Raw 層的鐵律

#### ✅ Raw 層允許的行為

- XML attribute 與資料表欄位 1:1 映射
- 欄位名稱允許規範化（如 snake_case）
- 保留 XML 中的原始取值形式（字串 / 數字字串 / Y/N / 空字串）
- 增加技術性欄位：
	- `sync_record_id`（來源檔案）
	- `snapshot_date`（匯入快照日期）
	- `created_at`

#### ❌ Raw 層絕不允許的行為

- 合併欄位（如多個金額欄合併為 amount）
- 推斷新欄位（如 `is_gift`、`is_active`）
- 改變語意（如 `visible='Y'` → boolean）
- 丟棄 XML 中存在的 attribute
- 使用業務命名（如 `transaction_id`、`amount`、`income`）

---

### 4.3 Raw 層的定位總結

> Raw 是事實，不是觀點。

Raw 層只回答一個問題：
**「當時 IMVU 給了我什麼資料？」**

---

## 5. `data_sync_records` 的角色定位

現有的 `data_sync_records` 表承擔以下職責：

- 原始 XML 檔案的持久化留存（`content`）
- 檔案層級的冪等控制（`hash`）
- 匯入批次與 Raw 資料之間的關聯

因此：

> `data_sync_records` 等同於 Raw File Meta / Binary Raw。

Raw 表透過 `sync_record_id` 反向關聯具體檔案。

---

## 6. Core / Biz 層設計原則

### 6.1 Core 層的定義

Core 層是系統對 Raw 資料的第一次業務理解結果，用於表達：

- 何謂一個使用者
- 何謂一個商品
- 何謂一筆交易

Core 層中的資料應當：
- 語義清晰
- 結構穩定
- 可被前端與業務邏輯直接使用

---

### 6.2 Core 層允許的行為

- 欄位合併（如金額欄位整合）
- 語義推斷（如 `is_gift`）
- 統一命名（如 `transaction_id`）
- 外鍵關聯建立（user / product / developer）
- 去重、驗證、正規化

### 6.3 Core 層的來源約束

> Core 層的所有資料，必須可追溯到 Raw 層。

Core 層不是人工編輯的資料，而是可重複計算的結果層。

---

## 7. Analytics 層設計原則

### 7.1 Analytics 層的定義

Analytics 層用於支持：

- 統計分析
- 趨勢分析
- Dashboard / 圖表展示
- 排名、彙總、比較

### 7.2 實現方式

Analytics 層可以通過以下方式實現：

- SQL View（優先，輕量、可維護）
- 物化統計表（在資料量或性能需要時）

Analytics 層的資料：
- 不作為事實來源
- 可隨時刪除並重新生成

---

## 8. 關於使用者與角色的統一認知

在 IMVU 平台中：

- Developer
- Buyer
- Recipient
- Reseller

本質上都屬於同一類實體：IMVU User。它們的差異只體現在業務上下文中的角色，而非身份本體。

因此：

- Raw 層保留各類 `user_id` 原始欄位
- Core 層統一抽象為 `imvu_user`
- 角色語義僅存在於具體業務關係中

---

## 9. 設計哲學總結

本專案採用的核心設計哲學是：

> 事實與觀點分離
> 歷史與當前分離
> 存儲與分析分離

一句話總結：

> Raw 層負責「我看到了什麼」，
> Core 層負責「我理解這是什麼」，
> Analytics 層負責「我想怎麼看」。

---

## 10. 設計取捨說明

本項目明確不引入獨立的 Staging Raw 層，原因包括：

- 已保留完整原始 XML 檔案
- 專案規模與複雜度不需要額外過渡層
- 簡化心智模型，避免層級語義混亂
- 強化 Raw 與 Core 的責任邊界

如未來需求變化，可在不破壞現有 Raw / Core 的前提下擴展。

---

## 11. 後續實施順序建議

推薦的實施順序為：

1. 定義並鎖定 Strict Raw 表結構（完全對齊 XML）
2. 實現 XML → Raw 的解析與導入
3. 設計並實現 Core 層業務表
4. 構建 Analytics 視圖或統計表
5. 前端與 API 基於 Core / Analytics 層對接

---

本文檔為架構級設計說明，具體表結構與實現細節請參考對應模塊文檔與程式碼。

