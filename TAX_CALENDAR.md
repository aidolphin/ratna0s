# Tax Calendar

Status: **Planned (Phase 5).** No deadline is shipped yet.

## Data model

```
taxCalendar[] {
  id, taxType, jurisdiction, periodLabel, periodFrom, periodTo,
  filingDeadline, paymentDeadline, responsibleUserId,
  status: upcoming | due-soon | overdue | prepared | submitted | paid | verified,
  sourceUrl, verifiedAt, verifiedBy, notes
}
```

## UI

- Calendar and list view with filters: tax type, fiscal year, status, owner.
- Amount payable, paid and remaining from tax periods/payments.
- Reminder rules (days before deadline) with in-app notifications.
- No automatic “paid” status without a verified payment record.

## Deadline verification

Every deadline template must be stored with an official source URL, effective period and verification date. Templates for VAT, TDS, income tax, advance tax, annual reporting, renewals and other filings will be added only after official verification against ird.gov.np or the responsible agency. Manual override is allowed but audited.
