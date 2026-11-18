# RatnaOS PWA Pilot v0.1

A luxury-style, installable jewellery operations prototype by Quantum Leaf Automation.

## Quick Start

Requires Node.js 18+ and npm.

```bash
cd "/Users/sagarthapa/Downloads/RatnaOS_PWA_Pilot (1)"
npm install
npm run dev
```

Open **http://localhost:5173** (or the port shown in terminal) in your browser.

For a distributable static build:
```bash
npm run build
```

Upload the **contents** of `dist/` to HTTPS static hosting. The PWA can then be installed through supported browser installation controls. For offline caching, first visit the deployed application while online.

## Features in this pilot

- **Dashboard** - Stock value, sales, gold/silver inventory snapshot
- **Inventory** - Jewellery items with unique codes, metal/purity/weight, indicative pricing
- **Point of Sale** - Sales register with customer, payment method, discount, downloadable receipts
- **Old Gold Exchange** - Assessment register with weight, purity, rate, deductions
- **Karigar Management** - Work orders with issued metal, due dates, completion tracking
- **Knowledge Center**
  - Jewellery catalogue (5 categories, 95 types) and 12 regional collections
  - Gemstones (type, Mohs hardness, treatment notes) and processes/designs
  - Metals, gold/silver purity tables
  - Measurement types and 23 units, with a type-safe converter (mass, gemstone mass, length, purity)
  - Ring Size Finder and US/UK/EU/JP/IN reference table (Needs Verification)
  - Currencies for formatting (no exchange rates stored) and international standards
  - 40-item workshop tool catalogue
  - Regional Config for Nepal (VAT, BS fiscal year, NBSM) and India (GST, HSN 7113, BIS/HUID)
  - Admin/manager master-data editing with JSON record editor (`knowledge:write`)
  - Cross-language search across categories, units, metals, tools and trade terms
- **Accounting (Phase 2)** - Double-entry foundation plus manual vouchers, Day/Cash/Bank books, custom chart of accounts, opening balances, fiscal-year close/reopen, trial balance, ledger, reversal, idempotent backfill and live posting from POS sales, metal transactions and supplier payments. See `ACCOUNTING_ARCHITECTURE.md`.
- **Production Cost & Materials**
  - Raw Materials Master (Metals, Gemstones, Consumables) with rates & stock
  - Unit Converter (Grams, Milligrams, Tola, Aana, Lal, Ratti, Carats)
  - BOM / Job Card Calculator:
    - Net Metal Cost (gross - stone/wax × live rate)
    - Jarti Wastage (presets: Handcrafted 10%, Bridal 12%, Machine Cast 4%, Chain 3%)
    - Jyala Making Charges (per gram, per tola, flat, % of metal, tiered by process)
    - Stone/Gem rows with setting charges
    - Hallmark/HUID + Overhead allocation
  - Karigar Metal Issue/Return Ledger with wastage alerts
  - Cost Summary with visual breakdown bars
  - Pricing & Margin Simulator (markup % → selling price, profit margin)
  - CSV Export (Job Card for workshop, Cost Sheet for accounting)
- Local operational audit log
- JSON data export/backup
- Service worker and PWA manifest

## Language, country and formatting

The app ships with an English/Nepali/Hindi localization layer and regional profiles.

- **Switch language** from the header pill (English → नेपाली → हिन्दी) or Settings → Language. The choice is stored in `settings.language` and survives reloads.
- **Country profile** (Settings → Country) sets currency, tax label/rate, weight unit, date format, dial code and fiscal-year convention. Profiles included: Nepal (VAT 13%, NPR, tola), India (GST 3%, INR, tola), UAE, Saudi Arabia, Qatar, US, UK, Australia, Canada, Singapore, Hong Kong, Malaysia, Sri Lanka, Bangladesh.
- **Money/numbers** follow the country locale (`NPR 12,34,567.89` for Nepal/India lakh grouping, `USD 1,234,567.89` elsewhere). Nepali UI uses Devanagari digits by default, switchable to Latin numerals in Settings → Language.
- **Dates** follow the country pattern (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD). Audit logs and receipts use localized date-time.
- **Knowledge Center**
  - Catalogue sizes, purity and unit factors, and regional trade terms are documented in `JEWELLERY_MASTER_DATA.md`, `MEASUREMENT_STANDARDS.md`, `REGIONAL_TERMINOLOGY.md`, `TOOL_CATALOGUE.md`, `REGIONAL_COMPLIANCE.md`, `CURRENCY_CONFIGURATION.md` and `LANGUAGE_TRANSLATIONS.md`.
  - Karat (purity) and carat (mass) are separate measurement types; the converter refuses cross-type conversions.
  - Regional and uncertain values carry a "Needs Verification" badge and must be confirmed locally before use on invoices.
  - Settings → Local Confirmation tracks tola/masha/ana/lal/ratti factors, NBSM/BIS hallmarking and VAT/GST details until an admin confirms them; invoices carry a pending-confirmation note until then.

### How translation works

English source text is used as the translation key, so untranslated strings always fall back to readable English.

- `locales/ne.json` — English → Nepali dictionary (1,174 entries).
- `locales/ne.terminology.json` — approved jewellery trade terminology and banned variants.
- `npm run ne:check` — validates banned variants, untranslated strings and terminology drift (see `NEPALI_LANGUAGE_AUDIT.md`).
- `npm run test:accounting` — double-entry precision, balance, rollback, idempotency, reversal and posting tests.
- `locales/en.json` — the extracted catalog of every translatable string (for reference).
- `locales/ne.pending.json` — worksheet of English strings still missing a Nepali value.
- `scripts/extract_i18n.cjs` — regenerates the catalog.

```bash
npm run i18n:extract   # rescan source, refresh en.json + ne.pending.json, print coverage
npm run i18n:check     # coverage report only
```

To add translations: fill values in `locales/ne.pending.json`, move them into `locales/ne.json`, then run `npm run i18n:extract` to confirm coverage. Static headings and labels not yet routed through `t()` are picked up by the DOM localization pass, so new dictionary entries take effect without code changes.

### Bikram Sambat, VAT and daily rates

- **Calendar** (Settings → Calendar): Bikram Sambat, Gregorian, or both. Nepal defaults to BS; Nepali UI shows BS with Devanagari digits and Nepali month names. Date inputs remain Gregorian.
- **VAT / PAN Number** (Settings) prints on invoices. VAT respects "Tax Inclusive Pricing": inclusive bills keep the entered total and split out the contained VAT (13% in Nepal); exclusive bills add VAT on top. Saved sales are never recalculated.
- **Daily Rate Sync** (Settings and the dashboard rates card): optional JSON endpoint with configurable gold/silver field paths and source unit (per tola, gram, or 10 g). Runs once per day on open, or manually via **Sync Now**. Requests are validated and converted to per-gram; failures leave existing rates unchanged. No prices are bundled — you must point it at a source you are licensed to use (cross-origin restrictions may require a proxy).

### Adding a country

Add a block to `COUNTRIES` in `i18n.js` (currency, locale, tax label/rate, weight unit, date format, dial code, fiscal year). It immediately appears in Settings.

## Critical limitations

**NOT PRODUCTION READY. DO NOT USE FOR REAL JEWELLERY TRANSACTIONS.**

- Data is saved only in the current browser using localStorage. It is not encrypted, automatically backed up, or synchronized.
- No authentication, server-side authorization, multi-tenant isolation, or remote database.
- No certified accounting, tax calculations, Nepal IRD-approved invoices, or legally validated transaction workflows.
- Pricing calculations are illustrative. Gold purity, weights, taxes, rounding, exchange, and metal ledger rules require domain expert validation.
- No atomic database transactions, immutable server audit log, returns, inventory reversals, or conflict-safe offline sync.
- Karigar and old-gold records do not update a balanced metal ledger.
- The icon is SVG; some platforms require PNG icons for full install compatibility.
- Before production: design PostgreSQL ledger, API, secure roles, tests, recovery, offline transaction protocol, invoicing compliance, and independent financial reconciliation checks.

## Deployment note

This is a static Vite app. A static hosting account can serve `dist/`, but that does **not** make it a secure multi-user SaaS system.