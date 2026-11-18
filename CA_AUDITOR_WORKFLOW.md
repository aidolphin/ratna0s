# CA and Auditor Workflow

Status: **Planned (Phases 6–7).** Phase 1 adds only accounting read/post permissions.

## Accountant

- Voucher entry (payment, receipt, journal, contra, purchase, sales, expense).
- Bank reconciliation, outstanding AR/AP, monthly and annual close.
- VAT/TDS preparation and report export.
- Attachments per voucher; searchable voucher register.
- Draft → posted workflow with reversal for corrections.

## Chartered Accountant

- Client list with financial-year selection and period comparison.
- Review journals, trial balance, financial statements, VAT/TDS reconciliation.
- Adjusting entries as separate approval-tracked journals.
- Client document requests, pending filing tasks and sign-off.

## Auditor

- Planning, checklist, evidence index and sampling.
- Voucher/purchase/sales verification, bank reconciliation review, inventory and metal stock verification.
- Fixed assets, customer/supplier confirmations, tax compliance review.
- Findings and observations linked to evidence, without editing source transactions.
- Immutable audit trail: append-only records with sequence and hash chaining (Phase 9).

## Isolation constraint (important)

RatnaOS currently stores all data in one browser `localStorage` profile. True CA multi-client isolation requires a backend or encrypted per-client profiles. Phase 6 will not fake isolation; a design decision is required before implementation.

## Planned roles

Business Owner, Accountant, Chartered Accountant, Auditor, Tax Consultant, Finance Manager, Branch Manager, Cashier — each mapped to explicit read/create/post/approve/export/close permissions.
