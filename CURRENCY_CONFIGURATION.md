# Currency Configuration

Last updated: 2026-11-18 · Files: `i18n.js` (`COUNTRIES`, formatters), `src.js` (settings)

## Model

- Each country profile defines one display currency: code, symbol, locale and grouping.
- Currency is a **formatting** concern. Amounts are stored as plain numbers;
  there is no FX table, no conversion engine and no base-currency ledger.
- Currency code is editable in Settings (`settings.currency`); changing country applies
  the preset but does not rewrite stored amounts.

## Supported profiles

| Code | Country | Currency | Symbol | Grouping example |
| --- | --- | --- | --- | --- |
| NP | Nepal | NPR | रू | रू 12,34,567.89 |
| IN | India | INR | ₹ | ₹ 12,34,567.89 |
| AE | UAE | AED | د.إ | AED 1,234,567.89 |
| SA | Saudi Arabia | SAR | SR | SAR 1,234,567.89 |
| QA | Qatar | QAR | QR | QAR 1,234,567.89 |
| US | United States | USD | $ | USD 1,234,567.89 |
| GB | United Kingdom | GBP | £ | GBP 1,234,567.89 |
| AU | Australia | AUD | A$ | AUD 1,234,567.89 |
| CA | Canada | CAD | C$ | CAD 1,234,567.89 |
| SG | Singapore | SGD | S$ | SGD 1,234,567.89 |
| HK | Hong Kong | HKD | HK$ | HKD 1,234,567.89 |
| MY | Malaysia | MYR | RM | MYR 1,234,567.89 |
| LK | Sri Lanka | LKR | Rs | LKR 1,234,567.89 |
| BD | Bangladesh | BDT | ৳ | BDT 1,234,567.89 |

Nepal and India use lakh/crore grouping (`12,34,567.89`); the others use thousands
grouping (`1,234,567.89`). Nepali UI renders amounts with Devanagari digits.

## Formatting API

```js
formatMoney(1234567.89, { currency: 'NPR', locale: 'ne-NP' });
formatNumber(1234567.89);
formatWeight(11.6638, { weightUnit: 'tola' });
```

`formatMoney` accepts a settings object (`state.settings` in `src.js`) so currency,
locale and digit rules follow the active shop configuration.

## Rules

1. **No automatic FX.** Mixed-currency transactions are not netted, converted or hidden.
   If a purchase is in another currency, record the actual settled amount in the ledger
   currency and keep the source currency in notes.
2. **Rate is never currency.** Metal rate per gram/tola is independent of the currency
   code and must match the currency the rate was quoted in.
3. **Display only.** Changing currency in Settings changes formatting, not history.
4. **No rounding policy per currency** is enforced beyond 2-decimal money formatting;
   round-off adjustments are manual and must be visible on the invoice.
5. **Symbols are presentational.** The ISO code is authoritative in stored data.

## Future work

- Currency master records with effective dates and a locked base currency.
- Multi-currency invoice header with explicit exchange-rate field (documented, never
  applied silently).
- Round-off rule per currency (e.g. nearest rupee) with a printable adjustment line.
