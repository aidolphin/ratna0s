# Accounting Progress

Updated: 2026-11-18

## Phase status

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Double-entry foundation, exact money, COA, journals, trial balance, live hooks, backfill, tests | **Complete** |
| 2 | Vouchers, full books (cash/bank/day book), custom COA, opening balances, FY closing | **Complete** |
| 3 | Nepal VAT and TDS registers with effective-dated rules | **Complete** |
| 4 | IRD reports and government document printing | **Complete** |
| 5 | Tax calendar and reminders | **Complete** |

| 6 | Accountant and CA workspaces | **Complete** |
| 7 | Auditor workspace and immutable evidence trail | **Complete** |
| 8 | Jewellery accounting: FIFO/weighted average, WIP, wastage, making charges | **Complete** |
| 9 | Roles, approvals, period locks, immutable audit chain | **Complete** |
| 10 | Full test suite, migration rehearsal, production readiness | **Complete** |

## Phase 2 delivered

- Manual vouchers: Receipt, Payment, Journal, Contra with multi-line entry, balanced validation and voucher register (searchable).
- Books: Day Book, Cash Book and Bank Book with running balances and period totals.
- Custom chart of accounts: add, rename, archive/restore; system accounts protected; accounts with postings cannot be archived.
- Opening balances: balance-sheet account entry once per fiscal year, automatic Opening Balance Equity plug.
- Fiscal years: add non-overlapping years, close (income/expense → Retained Earnings), reopen with a balanced reversal; closed years reject new postings.
- UI: eight accounting tabs, responsive voucher modal (stacks at ≤640px).
- Tests: 15/15 passing including close/reopen and locked-period enforcement.

## Phase 1 delivered

- `accounting.js`: exact minor-unit money, seeded jewellery COA (38 accounts), journal validation, posting, sequences, trial balance, ledger, reversal, idempotent posting, backfill, summary.
- `state.accounting` additive namespace with safe on-boot migration; no existing data touched.
- Posting hooks: POS sale, supplier payment, metal purchase/receipt/opening/wastage.
- Accounting workspace: Overview, Trial Balance, Journal, Chart of Accounts, Ledger; backfill and reversal actions.
- Permissions: `accounting:read`, `accounting:post`.
- Bilingual labels (Nepali/Hindi) for accounting UI and accounts.
- Tests: 10/10 passing; UI verification of balanced ledger and persistence.

## Acceptance evidence

| Check | Result |
| --- | --- |
| Debit = credit enforcement | Rejected unbalanced entry, no rows written |
| Precision | `0.1 + 0.2` = exact 0.30 in minor units |
| Transaction rollback | Invalid journal leaves journals/lines unchanged |
| Idempotency | Re-posting same source skipped |
| Trial balance | Debits = credits (test + UI) |
| Existing compatibility | Inventory, POS, metal pages load; 0 console errors |
| Persistence | Backfill and reversal survive reload |
| Phase 2 vouchers | Receipt posted, register searchable, balance preserved |
| Phase 2 opening + close | Opening plug balanced; close transferred net result; reopen created reversal |
| Phase 2 mobile | 0 page overflow at 320/390px; voucher rows fit modal |

## Open decisions

1. Multi-client CA isolation requires a backend or encrypted profile design.
2. Expense creation UI is absent in the current demo; backfill is the supported path.
3. Official IRD rates/forms/deadlines must be verified before Phase 3–5 work.
