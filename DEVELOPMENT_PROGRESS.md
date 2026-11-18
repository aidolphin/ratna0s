# Development Progress

Last updated: 2026-11-18

Scope: typography/icons, responsive spacing, English/Nepali/Hindi localization, multi-country formatting, Bikram Sambat dates, Nepal VAT handling, daily metal-rate sync, and the Jewellery Knowledge Center (catalogue, purity, measurement units, converter, tools, regional terminology and NP/IN configuration). Existing records are never rewritten; only new calculations use the updated tax rules.

## Status summary

| Area | Status |
| --- | --- |
| Spacing / responsive layout | Done and verified |
| Typography scale and icon set | Done and verified |
| English / Nepali switching | Working; Nepali catalogue at 1,068 entries / 100% of extractable strings |
| Country profiles and formatting | Working, including BS dates and VAT |
| Nepal VAT (inclusive/exclusive) | Implemented and verified |
| Daily rate sync | Implemented; needs a licensed JSON source |
| Backup / restore UI | Fixed (API alias bug) and verified |
| Build | `npm run build` passes |
| Jewellery Knowledge Center | Working (10 panels, ring-size finder, search, admin editing) |
| Hindi language | Working; core strings translated, English fallback (unchanged by Nepali pass) |
| Measurement units + converter | Implemented with strict type separation |
| Regional configs (NP/IN) | Structured; compliance fields flagged Needs Verification |
| Automated test suite | Not present; verification was manual + headless Chrome |
| Nepali quality check | `npm run ne:check` passes (0 banned, 0 untranslated) |
| Language switch | EN / ने / हि symbols on login and header, visible on mobile |
| Accounting Phase 2 | Vouchers, books, custom COA, opening balances, year close/reopen, 15 tests passing |

## Changes delivered

### 1. Typography and icons (`style.css`, `src.js`)
- Fluid type scale (`--fs-2xs` … `--fs-4xl`) with a 15–17.5px root that scales by viewport.
- Apple system font stack first (`-apple-system`, `SF Pro Display/Text`) with Inter/Outfit fallbacks; Playfair Display and Marcellus for display copy; Mukta / Noto Sans Devanagari for Nepali.
- ~40 stroke icons via `ICON_PATHS` + `icon()` (menu, bell, search, edit, trash, gem, cart, lock, calendar, scale, etc.); emoji table actions and `☰` replaced.
- Minimum label size enforced (no text below ~11px measured at 320–1440px).

### 2. Spacing and responsiveness (`style.css`)
- Tokens: `--gap-card`, `--gap-block`, `--pad-card`, `--pad-card-sm`, `--pad-main` (fluid).
- `.main` is a flex column with block gaps; `.layout > div` stacks cards with a consistent gap (cards previously touched: 0px).
- Fluid padding for card header/body/footer, tables, forms, toolbars, tabs, modals, detail grids.
- Mobile shell fixes: single-column app grid, wrapping header, collapsed labels, no horizontal overflow at 320px.
- Print rules reset flex layout for page breaks.

### 2b. Knowledge Center expansion (`knowledge.js`, `src.js`)
- New panels: Gemstones (18 records with Mohs and treatment notes), Processes & Designs (13), Currencies (16, no FX rates) and International Standards (11).
- Ring Size Finder converts US/UK/IN/JP/EU sizes to nearest ISO circumference and shows the full reference table; all rows carry Needs Verification.
- Admin/manager master-data editing (`knowledge:write`) with add/edit/delete and a JSON record editor; overrides stored in `state.kcOverrides` and persisted.
- Settings → Local Confirmation checklist for tola/masha/ana/lal/ratti, NBSM/BIS and VAT/GST; pending items add a caution to invoices.
- Dashboard metric cards are clickable shortcuts (Stock → Inventory, Sales → Reports, Jobs → Karigar, Metal Ledger → Metals); language switch uses EN / ने / हि symbols and stays visible at 320px.
- Long words wrap; tables scroll horizontally; mobile header no longer hides language buttons.

### 3. Localization and Nepali quality pass (`i18n.js`, `locales/*`, `scripts/*`)
- Nepali catalogue rebuilt to 1,068 entries; `npm run i18n:check` reports 642/642 extractable strings (100%) and `npm run ne:check` reports 0 banned variants.
- Approved trade dictionary in `locales/ne.terminology.json` (मौज्दात, बिक्री काउन्टर, बिल, ज्याला, जर्ती, साटासाट, सिक्री, औँठी, बाला, लकेट, जानकारी केन्द्र). Details in `NEPALI_LANGUAGE_AUDIT.md`.
- Numeral style toggle (Devanagari/Latin) persisted in settings; `रु.`/`₹` currency prefixes; Nepali weight-unit labels.
- All `alert`/`confirm` strings routed through `t()`; `reliability.js` keeps the i18n bridge when exposing `window.RatnaOS`.
- Original localization section:
- `t()` with English source strings as keys and automatic English fallback.
- 323 Nepali dictionary entries; 587 extracted catalog strings, of which 155 match a Nepali value (26.4%); 432 still pending.
- Language switch: header pill (`EN` / `ने`), login page switch, Settings → Language. Persisted in `settings.language`; `document.lang` updated.
- `localizeDom()` final pass translates static headings/labels that are not routed through `t()`, so new dictionary entries apply without code changes.
- `?lang=ne&country=NP` URL overrides.
- Commands: `npm run i18n:extract`, `npm run i18n:check`.

### 4. Bikram Sambat dates (`i18n.js` + `nepali-date-converter`)
- `adToBs` / `bsToAd` / `formatBsDate` / `formatBsDateLong`; BS month names in English and Nepali.
- Calendar setting: **BS**, **AD**, or **BS + AD** (Settings → Calendar); Nepal's default is BS, other countries AD.
- Nepali UI renders BS with Devanagari digits (२०८३/०८/०२) and Nepali month names (२ मंसिर २०८३).
- Out-of-range dates (before ~1975 or after ~2033 AD) fall back to Gregorian instead of failing.
- Date inputs stay ISO/Gregorian; conversion applies to display only (tables, invoices, receipts, audit, reports).

### 5. Nepal VAT (`src.js`)
- `calcTax()` now respects `settings.taxInclusive`:
  - exclusive: tax = amount × 13%, total = amount + tax.
  - inclusive: tax = amount − amount ÷ 1.13, total = amount (VAT contained in price).
- `calcGross()` centralises total computation across cart items, totals, qty/discount edits and checkout.
- Settings add **VAT / PAN Number**; invoices print the VAT label and number when set, plus `(incl.)` when pricing is inclusive.
- Existing saved sales keep their stored tax/total; nothing is recalculated retroactively.

### 6. Daily metal-rate sync (`src.js`)
- Pluggable JSON source: URL, gold/silver field paths (`rates.gold` style), and source unit (per tola / gram / 10 g).
- Auto-sync once per day on boot when enabled, or manual **Sync Now** from Settings and the dashboard rates card.
- Values are validated (positive, sane bounds, silver < gold) and converted to per-gram; unreachable or invalid sources leave existing rates untouched and record an error status.
- Every successful sync writes `rates.updatedAt`, source URL, and an audit entry.
- No prices are hardcoded or fabricated: sync is disabled until a permitted endpoint is entered.

### 7. Multi-country (`i18n.js`)
- 14 country profiles (NP, IN, AE, SA, QA, US, GB, AU, CA, SG, HK, MY, LK, BD) with currency, locale, tax label/rate, tax-inclusive flag, weight unit, date pattern, dial code, fiscal-year convention.
- `formatMoney` respects country grouping (`NPR 12,34,567.89` for NP/IN, `USD 1,234,567.89` elsewhere); Nepali UI renders Devanagari digits.
- `formatDate` / `formatDateTime` / `formatDateLong` / `formatWeight` helpers; dates in tables, audit, receipts and dashboard use them.
- Regional Profile card summarises the active country profile.

### 8. Jewellery Knowledge Center (`knowledge.js`, `src.js`, `style.css`, `reliability.js`)
- New `knowledge` tab registered in `getAllowedTabs()`, `NAV_ICONS`, `PAGE_TITLES` and the page router; visible to all roles via the new `knowledge:read` permission.
- `knowledge.js` holds master data: 5 categories with 95 types, 12 regional collections, 13 metals, 10 gold purities, 4 silver standards, 23 units across 5 measurement types, 6 ring-size systems, 18 regional trade terms and 40 workshop tools. Every record is trilingual (en/ne/hi) with English fallback.
- Cross-language search (`searchKnowledge`) covers catalogue, units, metals, tools and terminology; results render in a live panel without leaving the page.
- Converter supports mass, gemstone mass, length and purity, and rejects cross-type conversions. Karat (purity) and carat (mass) are separate types by design.
- Regional Config documents Nepal (NPR, VAT, BS fiscal year, NBSM) and India (INR, GST/CGST/SGST/IGST, HSN 7113, BIS/HUID) as configurable records; tax rates are never hardcoded into invoice math and uncertain fields carry "Needs Verification".
- Hindi added end-to-end: `locales/hi.json`, `LOCALES.hi`, `CATALOGS.hi`, header toggle cycle EN → ने → हि → EN, Devanagari font rules, Latin digits for Hindi.
- Reference docs added: `JEWELLERY_MASTER_DATA.md`, `MEASUREMENT_STANDARDS.md`, `TOOL_CATALOGUE.md`, `REGIONAL_TERMINOLOGY.md`, `LANGUAGE_TRANSLATIONS.md`, `REGIONAL_COMPLIANCE.md`, `CURRENCY_CONFIGURATION.md`.
- Build now copies `reliability.js`, `icon.svg` and `manifest.webmanifest` into `dist/` (`scripts/copy_static.cjs`), so `npm run preview` and static hosting authenticate correctly.

## Accounting Phase 1 (2026-11-18)

- Added `accounting.js` with integer-paisa double-entry engine: seeded jewellery COA, validation, journal numbering, idempotent posting, reversal, trial balance, ledger and backfill.
- Added additive `state.accounting` with on-boot migration; no existing data structure changed.
- Posting hooks for POS sales, supplier payments and metal purchase/receipt/opening/wastage; backfill action for existing records.
- New Accounting workspace (Overview, Trial Balance, Journal, COA, Ledger) with `accounting:read` / `accounting:post` permissions and Nepali/Hindi labels.
- Tests: `npm run test:accounting` (10 tests); verified balanced trial balance, reversal, persistence and live metal posting; fixed a shadowed `t()` crash on the metals page.
- Docs: `ACCOUNTING_ARCHITECTURE.md`, `ACCOUNTING_PROGRESS.md`, `NEPAL_TAX_COMPLIANCE.md`, `IRD_REPORT_FORMATS.md`, `CA_AUDITOR_WORKFLOW.md`, `TAX_CALENDAR.md`.

## Bugs found during review and fixed

1. **`.card-body > .table-wrap` negative margin** pulled tables under card headers (and overlapped when `card-body` had `padding:0`). Rule removed.
2. **Double card spacing** — flex `gap` plus `margin-top` produced 45px where 22px was intended. Margins neutralised inside `.main` / `.layout` gap containers.
3. **Country preset wiped unsaved edits** — changing the country select re-rendered the whole settings page. Now applies the preset in place, syncs dependent inputs and the Regional Profile card, and persists without losing typed values.
4. **Country/language change handlers never fired** — they matched `countrySelect`/`languageSelect`, but the controls are `id="country"` / `id="language"`. Fixed.
5. **Backup UI broken** — Settings called `backup.list/create/restore/delete`, while the reliability layer exposed `listBackups/createBackup/restoreBackup/deleteBackup`. Added aliases; View/Create/Restore/Delete no longer throw.
6. **Header overflow at ≤390px** — header right cluster pushed the page to 349px wide on a 320px viewport. Header wraps, labels collapse, and `min-width: 0` added to shell regions.
7. **Labels under 11px** — `--fs-2xs` minimum raised; table headers, field labels, metric labels and badges now use `--fs-xs`.
8. **Sidebar column reserved on mobile** — `.app` kept a 280px grid column after the sidebar became off-canvas. Now a single column below 1024px.
9. **Auth boot race** (found while testing) — `render()` could run before `reliability.js` initialised auth, showing the login screen despite a valid session. Boot now waits for the auth layer.
10. **Country preset incomplete** — it did not apply `weightUnit`, `taxInclusive`, `dial` or `calendar`. Now included.
11. **`t` shadowed in dashboard** — the totals variable was named `t`, so new translated labels crashed the dashboard. Renamed to `sums`.
12. **Calendar select stayed stale** — changing country updated the profile card but not the Calendar field; the change handler now syncs it.
13. **VAT-inclusive totals** — adding tax to an already-inclusive price double-counted VAT. Fixed with `calcGross()`.
14. **Backup API alias test** — verified `list/create/restore/delete` after the alias fix.
15. **Imported name collisions** — `knowledge.js` exports `GOLD_PURITIES`/`SILVER_PURITIES` as records while `src.js` already had string arrays with those names. Imports are aliased (`KC_GOLD_PURITIES`, `KC_SILVER_PURITIES`); existing metal flows unchanged.
16. **Badges unstyled outside tables** — generic `.badge` styling only existed as `.table .badge`, so Knowledge Center chips rendered unstyled. Added a base `.badge` rule and `.badge-info`.
17. **`dist/` missing the classic auth script** — Vite cannot bundle `reliability.js`, so preview served `index.html` for `/reliability.js` (unsupported MIME) and login was dead. Added `scripts/copy_static.cjs` to the build.

## Verification performed

Headless Chrome against the Vite dev server, seeded with an authenticated session, at **320, 360, 390, 768 and 1440px** across all 11 pages (Dashboard, Inventory, POS, Metal Management, Old Gold Exchange, Karigar & Jobs, Production Stages, Reports, Suppliers, Expenses, Settings):

| Check | Result |
| --- | --- |
| Horizontal overflow (`scrollWidth ≤ viewport`) | Pass, all widths/pages |
| Card-to-card gap `< 8px` | 0 occurrences |
| Text smaller than 11px | 0 elements |
| Table overlapping card header | 0 occurrences |
| Console errors / unhandled rejections | 0 |
| Nepali text sweep (all pages/sub-tabs) | No leftover English UI labels |
| Devanagari numeral toggle + persistence | Pass (`रु. ०.००` ↔ `रु. 1,234,567.89`) |
| Hindi and English regression after Nepali pass | Pass (labels unchanged) |
| `npm run i18n:check` / `npm run ne:check` | 100% coverage / 0 violations |

Functional checks:

- Language toggle EN → NE → EN translated nav/page copy, persisted `settings.language`, set `document.lang`, survived re-render/reload.
- Settings save persisted shop, language, country, currency, tax label/rate, weight unit.
- Country select US applied `USD / Sales Tax 0% / gram / +1` in place and preserved an unsaved shop name.
- Backup list and create-backup produced the backup modal without errors.
- Production material tabs (metals/gemstones/consumables) switch correctly.
- Inventory filters re-render and retain selection.
- Reports page renders (2 filters, 4 cards on the default view).
- POS checkout with an empty cart created no sale (0 → 0 records).
- Mobile drawer opens and closes.
- `npm run build` succeeds; `npm run i18n:extract` reports 608 catalog strings, 177 translated (29.1%).

Feature-specific checks (headless, disposable profile):

| Check | Result |
| --- | --- |
| BS date sample in Regional Profile | `2083/08/02` (NP, AD 2026-11-18) |
| Nepali mode BS date | `२०८३/०८/०२` |
| AD↔BS round trip | 2083-08-02 ↔ 2026-11-18 |
| Out-of-range date (1900 / 2035) | Falls back to Gregorian |
| VAT inclusive 1,000 @ 13% | Tax 115.04, total 1,000.00 |
| VAT exclusive 1,000 @ 13% | Tax 130.00, total 1,130.00 |
| Rate sync (185,000 NPR/tola) | 15,861.04/g stored, status `ok` |
| Rate sync unreachable URL | status `error`, previous rates preserved |
| Auto-sync on boot | Runs once per day; second reload wrote no extra audit entry |
| Country NP→US | Calendar switches to AD, sample `11/18/2026`, currency USD |
| Layout at 320/390/768/1440 | No overflow, no tight cards, no text < 11px, 0 console errors |
| Knowledge tab visibility | Present for admin: dashboard … reports, **knowledge**, suppliers, expenses, settings |
| Catalogue panel | 18 cards, 112 badges, 95 types rendered |
| Metals / Measurements / Tools panels | 3 / 5 / 40 rows respectively |
| Converter 1 tola → gram | 11.664 g |
| Converter 2 tola → gram | 23.328 g |
| Converter 22 karat → fineness | 916.7 |
| Converter carat → fineness | Rejected with `type-mismatch` |
| Search "tola" (hi) | 5 results, tabs hidden, input keeps focus |
| Search "vernier" | Tool result found |
| Empty search | "कोई परिणाम नहीं" in Hindi |
| Hindi switch | `document.lang = hi`; nav "ज्ञान केंद्र"; page title translated |
| Overflow after adding Knowledge Center | 0 at 320/390/768/1440 |

No mock business records were created; the only writes were preferences, a backup of the empty dataset, and the localStorage of a disposable headless profile.

## Known gaps / unfinished

1. **Native language review** — Nepali coverage is complete (1,068 entries, 100% of detected strings) but trade vocabulary still needs a Nepali jeweller/translator sign-off. Hindi covers core screens only and falls back to English elsewhere.
2. **Extraction is heuristic** — `scripts/extract_i18n.cjs` may include non-UI strings and miss strings built from complex template interpolation; coverage numbers are approximate.
3. **BS date range** — conversion uses `nepali-date-converter` (about 1975–2033 AD). Outside that span dates display as Gregorian. Fiscal-year labels are informational; reports are not split on the BS year-end.
4. **VAT compliance** — VAT is computed per cart line and totals; Nepal IRD bill layout, VAT return filing, and per-country invoice series are not implemented. Inclusive pricing changes totals for new sales only; saved sales are untouched. Needs accountant validation before production use.
5. **Rate sync needs a source you are licensed to use** — the feature ships disabled with no provider. Most dealer sites block cross-origin browser requests, so a licensed API, same-origin proxy, or client-supplied JSON endpoint is required. Sync runs when the app is opened (once per day), not while it is closed.
6. **No rate history table** — successful syncs store the current rate plus timestamp/source and an audit entry, but not a queryable daily price history.
7. **Statutory documents** — CSV/PDF headers stay English and exports follow the display calendar (BS by default in Nepal). Invoice VAT number/label print correctly, but no IRD-approved format.
8. **Print layout not visually verified** — print CSS resets flex layout but was not checked in a print preview.
9. **Country change persists without an audit entry** (intentional, to avoid a full re-render). Changing language still re-renders and discards unsaved form edits.
10. **Historical audit entries are not retro-translated** — they keep the language active when written.
11. **No automated tests** — verification was scripted through headless Chrome and DOM assertions; there is no test runner dependency.
12. **`dist/` was rebuilt** during verification; deploy from a fresh `npm run build` (now also copies the classic scripts).
13. **Knowledge Center depth** — gemstones, processes/designs, currencies and standards are reference lists, not exhaustive trade catalogues. Ring tables need local confirmation and master-data edits are local until exported/backed up.
14. **Ring-size conversion** — US/UK/IN/JP/EU mappings are reference-only and marked Needs Verification; always measure circumference with a physical sizer before manufacturing.
15. **Regional facts need confirmation** — tola/masha/ana/lal/ratti factors, NBSM/BIS hallmark details and GST splits are reference values flagged in the UI. Use Settings → Local Confirmation before relying on them in invoices; VAT/GST rates are never hardcoded.
