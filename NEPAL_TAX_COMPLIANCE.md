# Nepal Tax Compliance

Status: **Not implemented yet.** This document records verified-scope rules for Phase 3 and deliberately contains no unverified rates, deadlines or form numbers.

## Rules

1. All tax rates, thresholds, filing periods and forms must be configurable with **effective dates**. No permanent hardcoding.
2. Historical periods must keep the rules that were valid at the time.
3. No tax result is labelled “official” without verification against the Inland Revenue Department (https://ird.gov.np/).
4. No payment is recorded as paid without a real payment reference and verification.

## Planned configuration model

```
taxRules[] { id, taxType, jurisdiction, rate, effectiveFrom, effectiveTo, basis, form, sourceUrl, verifiedAt, verifiedBy }
taxPeriods[] { id, taxType, fiscalYear, periodFrom, periodTo, dueDate, status }
taxPayments[] { id, taxType, periodId, amount, date, bankReference, voucherId, verified }
```

- VAT: output/input registers, adjustments, credit/debit notes, period close.
- TDS: category, recipient PAN, rate, deduction date, deposit, certificate.
- Income/advance tax: installment tracking and assessment records.
- Configurable validation: PAN format, VAT threshold, fiscal year.

## Verification sources required before Phase 3

- Current VAT Act/Regulations and return formats.
- Current TDS categories and rates with effective dates.
- PAN/VAT registration and invoice content rules.
- IRD portal file formats and accepted upload specifications.
- Payment voucher/bank challan requirements.

These must be documented with source URL and verification date before any rule is enabled.
