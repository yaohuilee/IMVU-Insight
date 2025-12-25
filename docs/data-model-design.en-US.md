# IMVU Insight — Data Structure and Layering Design

## 1. Purpose

This document describes the overall design principles and layering for data structures in the IMVU Insight project, specifically:

- Responsibilities of each data layer
- Allowed and forbidden behaviors for Raw / Core / Analytics layers
- How raw XML evolves into business objects and analytics results

The design aims to support:
- Traceable data imports
- Reconstructible business models
- Evolvable long-term analytics

---

## 2. Key Design Conclusions (summary first)

### 2.1 Layering Principle

> Strict Raw — no separate Staging Raw layer.
>
>- Raw layer: responsible only for facts
>- Core layer: responsible for business semantics
>- Analytics layer: responsible for how data is analyzed and presented

All field merges, semantic inferences, and business abstractions must occur in the Core layer or later.

---

## 3. Overall Data Flow

The overall data flow is:

```text
XML files
↓
data_sync_records (original file persisted — binary raw)
↓
Raw tables (Strict Raw — XML mirror tables)
↓
Core / Biz tables (business-object layer)
↓
Analytics (views / aggregated tables)
```

---

## 4. Raw Layer Design Principles (Strict Raw)

### 4.1 Definition of Raw

The Raw layer is a structured mirror of the original XML data. Its sole objective is:

> Make every XML attribute queryable via SQL.

The Raw layer does not express business viewpoints or perform business interpretation.

---

### 4.2 Rules of the Raw Layer

#### ✅ Allowed in Raw

 - 1:1 mapping of XML attributes to table fields
 - Field names may be normalized (e.g., snake_case)
 - Preserve original value forms from XML (strings, numeric strings, 'Y'/'N', empty strings)
 - Add technical columns such as:
	 - `sync_record_id` (source file)
	 - `snapshot_date` (import snapshot date)
	 - `created_at`

#### ❌ Forbidden in Raw

- Merging fields (e.g., combining multiple amount fields)
- Inferring new semantic fields (e.g., `is_gift`, `is_active`)
- Changing semantics (e.g., `visible='Y'` → boolean)
- Dropping attributes that exist in the XML
- Using business naming (e.g., `transaction_id`, `amount`, `income`)

---

### 4.3 Raw Positioning Summary

> Raw is facts, not opinions.

Raw answers only: “What did IMVU give me at that time?”

---

## 5. Role of `data_sync_records`

The existing `data_sync_records` table serves these roles:

- Persisting the original XML file content (`content`)
- Idempotency at file level (`hash`)
- Linking import batches to Raw data

Thus:

> `data_sync_records` equals Raw File Meta / Binary Raw.

Raw tables reference the originating file via `sync_record_id`.

---

## 6. Core / Biz Layer Principles

### 6.1 Definition of Core

The Core layer is the system's first business-aware interpretation of Raw data and is used to express:

- What constitutes a user
- What constitutes a product
- What constitutes a transaction

Data in the Core layer should be:
- semantically clear
- structurally stable
- directly consumable by the frontend and business logic

---

### 6.2 Allowed in Core

- Field merging (e.g., consolidating amount fields)
- Semantic inference (e.g., `is_gift`)
- Unified naming (e.g., `transaction_id`)
- Establishing foreign-key relationships (user / product / developer)
- Deduplication, validation, normalization

### 6.3 Traceability Constraint

> All Core-layer data must be traceable back to the Raw layer.

Core is not a manually edited dataset; it must be reproducible from Raw.

---

## 7. Analytics Layer Principles

### 7.1 Definition of Analytics

The Analytics layer supports:

- Statistical analysis
- Trend analysis
- Dashboards and visualizations
- Rankings, aggregations, comparisons

### 7.2 Implementation

Analytics can be implemented via:

- SQL views (preferred — lightweight and maintainable)
- materialized summary tables (when performance or scale requires)

Data in Analytics:
- is not a source of truth
- can be dropped and regenerated at any time

---

## 8. Unified View of Users and Roles

On the IMVU platform:

- Developer
- Buyer
- Recipient
- Reseller

These are all fundamentally the same entity: an IMVU user. Differences are business-contextual roles, not distinct identities.

Therefore:

- Raw layer preserves raw `user_id` attributes
- Core layer unifies to an `imvu_user` concept
- Role semantics are expressed in business relationships, not identity

---

## 9. Design Philosophy Summary

Core philosophy:

> Separate facts from viewpoints.
> Separate history from current state.
> Separate storage from analysis.

In one sentence:

> Raw answers “what I saw”,
> Core answers “what I understand it to be”,
> Analytics answers “how I want to look at it”.

---

## 10. Tradeoffs

The project explicitly avoids introducing a separate Staging Raw layer because:

- Original XML files are already preserved
- Project scale and complexity do not justify an extra layer
- It simplifies the mental model and avoids semantic confusion
- It clearly separates Raw and Core responsibilities

If requirements change, a staging layer can be added without breaking Raw/Core contracts.

---

## 11. Recommended Implementation Order

1. Define and lock Strict Raw table schemas (align fully with XML)
2. Implement XML → Raw parsing and import
3. Design and implement Core business tables
4. Build Analytics views or aggregated tables
5. The frontend and API consume the Core and Analytics layers

---

This is an architecture-level design document. For concrete table schemas and implementation details, consult module-level docs and code.

