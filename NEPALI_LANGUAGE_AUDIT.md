# Nepali Language Audit

Date: 2026-11-18
Scope: every user-visible string in the RatnaOS PWA (`src.js`, `reliability.js`, `knowledge.js`, `index.html`), the Nepali catalogue (`locales/ne.json`), and the shared formatting layer (`i18n.js`).

## Summary

| Metric | Before | After |
| --- | --- | --- |
| Nepali catalogue entries | 608 | 1,174 |
| Extractable strings covered | 431 / 608 (71%) | 671 / 671 (100%) |
| Banned variant hits | 74 | 0 |
| Untranslated Latin values | 23 | 0 |
| Raw English `alert`/`confirm` strings | 15 | 0 |
| Terminology drift | 11 terms | 0 (checked against `locales/ne.terminology.json`) |

Validation is enforced by `npm run ne:check` (`scripts/check_nepali.cjs --strict`); coverage is reported by `npm run i18n:check`.

## Corrected wording

| Wrong / awkward | Corrected | Reason |
| --- | --- | --- |
| ड्यासबोर्ड | मुख्य पृष्ठ | Dashboard, natural shop wording |
| स्टक / भण्डार | मौज्दात | Trade term for stock-in-hand |
| बिजक | बिल | Invoice as spoken in Nepali shops |
| सम्वत् | संवत् | Spelling |
| औंठी | औँठी | Spelling (candrabindu) |
| पेन्डेन्ट | लकेट | Pendant, native trade term |
| चुरा | बाला | Bangle; चुरा reads as glass bangles |
| हार (for necklace) | सिक्री | हार is a garland; सिक्री is the necklace |
| लम्बाई | लम्बाइ | Spelling |
| इकाई | एकाइ | Spelling |
| नोक्सान | घाटा | Loss, shop register language |
| सट्टापट्टा | साटासाट | Exchange, native term |
| सम्पादन | सच्याउनुहोस् | Edit, plain verb |
| रोज गोल्ड | गुलाबी सुन | Rose gold |
| ह्वाइट गोल्ड | सेतो सुन | White gold |
| रत्न तौल | रत्नको तौल | Grammar |
| क्यारेट (purity context) | करात | Karat is gold purity; carat stays क्यारेट for gem mass |

## Terminology applied

`locales/ne.terminology.json` is the single reference for trade vocabulary. Key decisions:

| English | Nepali | Avoid |
| --- | --- | --- |
| Dashboard | मुख्य पृष्ठ | ड्यासबोर्ड |
| Inventory / Stock | मौज्दात | स्टक, भण्डार |
| POS / Billing counter | बिक्री काउन्टर | पीओएस |
| Invoice | बिल | बिजक, इनभ्वाइस |
| Receipt | रसिद | — |
| Edit | सच्याउनुहोस् | सम्पादन, एडिट |
| Delete | हटाउनुहोस् | डिलिट |
| Exchange (old gold) | साटासाट | सट्टापट्टा, एक्सचेन्ज |
| Making charge / labour | ज्याला | मेकिङ चार्ज, लेबर |
| Wastage | जर्ती | वेस्टेज |
| Profit / Loss | नाफा / घाटा | मुनाफा (acceptable), नोक्सान |
| Necklace / Ring / Bangle / Pendant | सिक्री / औँठी / बाला / लकेट | हार, पेन्डेन्ट |
| Knowledge Center | जानकारी केन्द्र | नलेज सेन्टर |
| Needs Verification | प्रमाणित गर्न बाँकी | — |
| Unit | एकाइ | इकाई |

कालिगड is kept in regional terminology with कारिगर as the documented synonym; the UI uses कारिगर consistently.

## Module changes

1. **`locales/ne.json`** — rebuilt to 1,174 entries covering navigation, dashboard, inventory, POS, metals, old gold, karigar/jobs, production, reports, suppliers, expenses, settings, knowledge center (gemstones, processes, currencies, standards, ring sizes, admin editor), roles, statuses, payment methods, job stages, QC results, units and country names.
2. **`i18n.js`**
   - `getNumeralStyle` / `setNumeralStyle` with `state.settings.numeralStyle` persistence.
   - `translateDigits` applies Devanagari digits only when language is `ne` and style is `devanagari`.
   - Currency prefixes: `रु.` for NPR, `₹` for INR.
   - `formatWeight` emits Nepali unit labels (ग्राम, तोला, आना, लाल, रत्ती).
   - `localizeDom` also translates `.btn span` and `button span`.
3. **`src.js`**
   - Numeral style restored on boot and selectable in Settings (`Devanagari (१२३)` / `Latin (123)`).
   - Dashboard, inventory filters, POS cart/totals/payments/invoice, metals, job status badges, production stages, QC results, settings backup/regional sections and knowledge center translated.
   - English secondary subtitles hidden when the interface language is Nepali.
   - All `alert`/`confirm` messages routed through `t()`, including concatenated messages.
   - Fixed shadowed `t` in transaction rows by introducing `lt()` for `data-label`.
4. **`knowledge.js`** — spelling and trade-term sweep (21 ring, 44 necklace, 9 bangle, 2 pendant corrections); regional item lists have Nepali `itemsNe`; Hindi fields restored and verified.
5. **`reliability.js`** — retains the i18n bridge when exposing `window.RatnaOS` (previously the reassignment dropped `t`, so auth/notification strings stayed English).

## Formatting rules

- **Digits** — Devanagari (`१२३`) by default for Nepali; Latin (`123`) selectable in Settings; choice persists.
- **Money** — `रु. १,२३४,५६७.८९` (Nepali lakh/crore grouping, Devanagari digits) or `रु. 1,234,567.89` in Latin mode.
- **Weights** — Nepali unit names with Devanagari or Latin numerals following the toggle.
- **Dates** — Bikram Sambat with Nepali month names in Nepali mode; Gregorian stored and exported.
- **Technical tokens kept in Latin** — SKU, purity codes (`24K`, `PT950`), RatnaOS, CSV/PDF, BOM, HUID, JSON, `localStorage`, chemical symbols and SI units. Brands and standards (BIS, NBSM, ISO) are not transliterated.

## Verification

Headless Chrome, Vite dev server, authenticated session:

| Check | Result |
| --- | --- |
| All 11 pages in Nepali | No leftover English labels, buttons, table headers or empty states |
| `npm run i18n:check` | 671 / 671 candidates translated (100%) |
| `npm run ne:check` | 1,174 entries, 1,174 with Devanagari, 0 banned, 0 untranslated |
| Numeral toggle | `रु. ०.००` → `रु. 1,234,567.89` → `रु. १,२३४,५६७.८९`, persists across reload |
| Alerts/confirms | `झोला खाली छ` displayed from POS checkout |
| Language cycle | ne → hi → en; Hindi and English labels unchanged |
| Responsive | 0 horizontal overflow at 320/390/768/1440px |
| Console | 0 runtime exceptions |
| Build | `npm run build` passes; static scripts copied to `dist/` |

## Remaining items

1. **Native review** — trade vocabulary should be confirmed by a Nepali jeweller or translator before customer-facing use. Regional synonyms (कालिगड/कारिगर, जर्ती/वेस्टेज) may differ by district.
2. **Hindi depth** — Hindi is translated for core screens only; untranslated Hindi strings fall back to English by design.
3. **Audit history** — existing audit entries keep the language they were written in; they are not retro-translated.
4. **Extractor limits** — `scripts/extract_i18n.cjs` is heuristic; complex template interpolation can be missed, so 100% coverage means 100% of detected candidates.
5. **Legal/fiscal text** — IRD invoice wording, VAT return labels and certificate text still need accountant/legal validation; no regulation text was invented.
6. **Knowledge depth** — several reference panels remain English-only in data sources (ring-size tables marked Needs Verification, international standards).
