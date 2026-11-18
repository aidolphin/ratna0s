# IRD Report Formats

Status: **Planning only.** No IRD form, template or submission claim is implemented.

## Planned report center

1. VAT Sales Register
2. VAT Purchase Register
3. VAT Return Summary
4. Taxable Sales Report
5. Purchase Tax Report
6. TDS Deduction Report
7. TDS Payment Report
8. PAN Transaction Report
9. Tax Payment Statement
10. Annual Financial Statements
11. Income and Expense Report
12. Tax Reconciliation Report
13. Customer Transaction Statement
14. Supplier Transaction Statement
15. Audit Supporting Schedules

## Output policy

- PDF, Excel-compatible CSV and print-ready A4.
- Bilingual headers (Nepali/English), business PAN/VAT, fiscal year, period, document number, prepared/reviewed by, signature area, page numbers, printed date.
- No official government logo and no statement implying official approval.
- No direct IRD submission unless an official API is verified; otherwise produce validated files for manual upload/entry.

## Verification checklist before implementation

| Item | Required evidence |
| --- | --- |
| Return layout and field names | Official IRD form/template with source URL and date |
| Fiscal period rules | Current act/regulation reference |
| PAN/VAT field validation | Official specification |
| TDS certificate layout | Official template |
| Upload format | Portal-supported file specification |
| Payment voucher | Bank/IRD accepted format |

Until each row is verified, reports are internal management reports only.
