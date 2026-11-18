# Regional Compliance

Last updated: 2026-11-18 · Source: `knowledge.js` (`REGIONS`) · UI: **Knowledge Center → Regional Config**

> This document records configuration structure, not legal advice. Tax rates, thresholds,
> hallmark rules and invoice formats must be confirmed with the relevant authority and a
> local accountant before production use. The app ships no statutory numbers beyond the
> editable country presets.

## Nepal (NP)

| Field | Current configuration |
| --- | --- |
| Country code | NP |
| Currency | NPR (रू) |
| Locale | ne-NP |
| Timezone | Asia/Kathmandu |
| UI languages | Nepali, English |
| Fiscal year | Shrawan (mid-July); configurable |
| Tax label | VAT, editable rate (country preset 13%) |
| Tax treatment | Inclusive or exclusive, per settings |
| Tax ID printed | VAT / PAN number from Settings |
| Trade units | Tola, masha, ana, lal, ratti, gram |
| Hallmarking authority | Nepal Bureau of Standards & Metrology (NBSM) — Needs Verification |
| Invoice fields | VAT/PAN, invoice number, date (BS/AD), customer |

Notes:

- Gold and silver are commonly quoted per tola in retail trade; the invoice still prints
  the stored currency totals, never an approximated conversion.
- VAT-inclusive pricing is supported; stored historical sales are not recalculated.
- IRD bill layout, VAT return filing and BS fiscal-year reporting are **not** implemented.

## India (IN)

| Field | Current configuration |
| --- | --- |
| Country code | IN |
| Currency | INR (₹) |
| Locale | en-IN |
| Timezone | Asia/Kolkata |
| UI languages | Hindi, English |
| Fiscal year | April; configurable |
| Tax label | GST, with CGST / SGST / IGST placeholders |
| HSN | 7113 (jewellery of precious metal) |
| Trade units | Tola, masha, ratti, gram |
| Hallmarking authority | BIS — Needs Verification |
| Hallmark identifier | HUID (placeholder, no integration) |
| Invoice fields | GSTIN, HSN, invoice number, place of supply |

Notes:

- GST rates are **not hardcoded**. The country preset is editable; CGST/SGST/IGST splits
  and effective dates are configuration records, not statutory claims.
- The India preset in `COUNTRIES` currently seeds a 3% gold rate because that is the
  commonly applied jewellery rate, but this must be confirmed against current law.
- BIS hallmarking and HUID are structural placeholders only. No hallmark is claimed or
  verified by the app.
- Intra-state vs inter-state supply logic is not implemented.

## Comparison

| Item | Nepal | India |
| --- | --- | --- |
| Tax | VAT | GST (CGST/SGST/IGST) |
| Tax identifier | VAT / PAN | GSTIN |
| Fiscal year start | Shrawan (mid-July) | April |
| Standard calendar | BS | AD |
| Hallmark body | NBSM | BIS |
| Hallmark ID | — | HUID |

## Rules enforced in code

1. No tax percentage is hardcoded into invoice math; values come from settings.
2. No FX conversion is applied inside posted invoices.
3. Uncertain compliance fields carry "Needs Verification" and are surfaced in the UI.
4. The app never generates a certificate, assay or hallmark number.

## Not implemented

- E-invoicing / IRN, e-way bills.
- GST return preparation or GSTR export.
- BIS/HUID registration or lookup.
- Customs, import duty or export documentation.
- Statutory invoice templates approved by IRD or GST authorities.
