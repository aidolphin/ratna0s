# RatnaOS Accounting Architecture

Status: Phase 2 implemented (2026-11-18). Existing RatnaOS modules remain unchanged.

## 1. Design principles

1. **Additive integration** — accounting lives in `state.accounting`; no existing collection, field or route was renamed or removed.
2. **Exact money** — every ledger amount is an integer number of paisa (`CURRENCY_MINOR = 100`). Presentation converts with `fromMinor()` only. Ledger arithmetic never uses floating point.
3. **Balanced by construction** — `postJournal()` validates at least two lines, integer amounts, one side per line and debit = credit before writing. Invalid input returns an error and writes nothing.
4. **Idempotent posting** — a journal is unique on `(sourceType, sourceId)`. Backfill can be run repeatedly without double posting.
5. **Corrections by reversal** — posted journals are never edited. `reverseJournal()` creates a balanced counter-entry and marks the original reversed.
6. **Reuse existing business records** — sales, expenses, metal transactions and supplier payments remain the source documents; accounting stores only postings and links via `sourceId`.

## 2. State model

```
state.accounting
  meta { version, currencyMinor }
  accounts[]  { code, name, type, normal, system, archived, createdAt }
  journals[]  { id, no, date, memo, sourceType, sourceId, status, debit, credit, createdAt, postedAt }
  lines[]     { id, journalId, account, debit, credit, memo, lineNo }
  sequence    number (journal numbering)
```

`ensureAccounting(state)` is a safe migration: it creates missing structures and seeds the system chart of accounts once. Existing data is untouched. It runs on boot and before every render.

### Chart of accounts (seeded)

| Code | Account | Type |
| --- | --- | --- |
| 1000 / 1010 / 1020 | Cash / Bank / Card-Wallet clearing | asset |
| 1100 | Accounts Receivable | asset |
| 1200 | Inventory — Jewellery | asset |
| 1210 / 1220 | Metal Stock — Gold / Silver | asset |
| 1300 | Input VAT | asset |
| 1500 / 1510 | Fixed Assets / Accumulated Depreciation | asset |
| 2000 | Accounts Payable | liability |
| 2100 | Output VAT | liability |
| 2200 | TDS Payable | liability |
| 3000 / 3100 / 3200 | Owner’s Equity / Retained Earnings / Opening Balance Equity | equity |
| 4000 / 4100 / 4200 | Sales / Making Charges / Other Income | income |
| 5000 | Cost of Goods Sold | expense |
| 5100 / 5200 / 5300 | Gold / Silver / Diamond & Gem Purchases | expense |
| 6000–6900 | Operating expense accounts | expense |

## 3. Posting rules implemented

| Source | Debit | Credit |
| --- | --- | --- |
| Sale (paid portion) | Cash/Bank/Card by payment method | — |
| Sale (unpaid) | Accounts Receivable | — |
| Sale revenue | — | Jewellery Sales (total − VAT) |
| Sale VAT | — | Output VAT |
| Sale cost (when `costPrice` exists) | Cost of Goods Sold | Inventory — Jewellery |
| Paid expense | Expense account by category | Cash/Bank/Card |
| Unpaid expense | Expense account | Accounts Payable |
| Metal PURCHASE | Metal Stock | Accounts Payable |
| Metal RECEIPT (old gold) | Metal Stock | Cash |
| Metal OPENING_BALANCE | Metal Stock | Opening Balance Equity |
| Metal WASTAGE | Wastage & Loss | Metal Stock |
| Supplier payment | Accounts Payable | Cash/Bank/Card |
| ISSUE / RETURN (quantity only) | not posted | Phase 8 (WIP) |

Metal ISSUE/RETURN stay quantity movements until jewellery WIP accounting (Phase 8). Zero-value metal rows are intentionally skipped.

## 4. Live hooks

- `completePOSale()` → `postSale(state, sale, state.items)` before persistence.
- `recordSupplierPayment()` → `postSupplierPayment()` with a generated payment record.
- `recordMetalTxn()` → `postMetalTxn()` when the transaction is posted and has a financial value.
- Existing records are posted through **Accounting → Post existing transactions** (`backfill()`), which reports posted/skipped/errors and can be re-run safely.
- Expenses currently have no in-app creation flow; backfill posts paid expenses from `state.expenses`.

## 5. Reliability and permissions

- `accounting:read` — admin, manager, accountant, viewer.
- `accounting:post` — admin, manager, accountant.
- Backfill and reversal are permission-gated and confirmed.
- Journal numbers: `JV-YYYYMM-00001`, sequential.
- No deletion of journals/lines; reversal only.

## 6. Verification

- `npm run test:accounting` — 10 tests: precision, validation, rollback, idempotency, sale/VAT/receivable mapping, expense/payment, metal mappings, reversal, backfill, COA uniqueness.
- Headless UI test: backfilled 3 sources, trial balance equal (NPR 2,57,800.00 / 2,57,800.00), reversal kept the ledger balanced, data persisted after reload, live metal transaction posted automatically.
- Existing inventory/POS/metal flows re-tested with 0 console errors.

## 7. Phase 2 additions

- **Vouchers** — Receipt, Payment, Journal and Contra with multi-line entry; `postVoucher()` uses the same validation and closed-period guard; register supports search.
- **Books** — Day Book (all journals), Cash Book (1000) and Bank Book (1010) with running balances.
- **Custom COA** — add (3–6 digit unique code), rename, archive/restore; system accounts and accounts with postings are protected.
- **Opening balances** — balance-sheet accounts entered once per fiscal year; any difference posts to Opening Balance Equity (3200).
- **Fiscal years** — create non-overlapping ranges; close transfers income/expense balances to Retained Earnings (3100) and locks the period; reopen posts a reversal and unlocks. Closing journals use source `closing` with the fiscal-year ID, so closing is idempotent.
- **Guards** — `postJournal()` rejects vouchers, backfill and reversals dated inside a closed fiscal year.

## 8. Known limitations (Phase 2)

1. Single currency (shop currency); multi-currency is not implemented.
2. COGS uses item `costPrice` only; FIFO/weighted average valuation is Phase 8.
3. No cost centres, branch accounting, fixed assets, depreciation or bank reconciliation yet.
4. Opening balances can be posted once per fiscal year; corrections require a reversal (Phase 9 approval workflow).
5. Tax rules are not effective-dated yet; current VAT comes from shop settings (Phase 3).
6. Local-only storage: CA/auditor multi-client isolation requires a backend decision (Phase 6).
7. No server-side enforcement; permissions are UI/client-level in this PWA architecture.
8. Voucher attachments and approval workflow are Phase 9.
