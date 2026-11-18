# Language Translations

Last updated: 2026-11-18 · Files: `i18n.js`, `locales/en.json`, `locales/ne.json`, `locales/hi.json`, `scripts/extract_i18n.cjs`

## Architecture

- English source strings are the translation keys (`t('Save')`), so a missing entry falls
  back to readable English instead of showing a key.
- Catalogs: `en.json` (608 extracted strings), `ne.json` (395 entries), `hi.json` (182 entries).
- `localizeDom()` is a final pass that translates static markup and attributes
  (`placeholder`, `title`, `aria-label`, `data-tooltip`) after render.
- Locale metadata in `LOCALES`: `en-US`, `ne-NP`, `hi-IN`, all LTR.
- Language is persisted in `settings.language` and applied on boot; `document.lang` and
  `data-lang` drive font and typography rules.

## Switching

| Entry point | Behaviour |
| --- | --- |
| Header pill | Cycles EN → ने → हि → EN |
| Login screen | Language selector before sign-in |
| Settings → Language | Explicit list from `LANGUAGE_OPTIONS` |
| URL | `?lang=ne`, `?lang=hi` |

Changing language re-renders the page. Unsaved form input in the current page is
discarded (existing known behaviour).

## Number and date policy

| Locale | Digits | Grouping | Calendar |
| --- | --- | --- | --- |
| English | Latin | 1,234,567.89 | AD by default; BS selectable |
| Nepali | Devanagari (१२३) | 12,34,567.89 | BS by default |
| Hindi | Latin | 12,34,567.89 | AD by default |

Hindi deliberately keeps Latin digits. Devanagari digits are treated as a Nepali
presentation rule, not a Hindi one, and are never mixed into stored values.

## Coverage

| Metric | Value |
| --- | --- |
| Extracted catalog strings | 608 |
| Nepali entries | 395 |
| Hindi entries | 182 |
| Knowledge Center strings translated | Navigation, page, all five panels, converter messages, status badges |

Uncovered text falls back to English. Coverage is not a correctness guarantee: every
trade term in `ne.json`/`hi.json` still needs a native reviewer before customer-facing use.

## Conventions

- **Do not machine-translate product names.** Tilhari, pote, naugedi, kada, jhumka,
  kundan and polki stay as trade names, transliterated into the local script.
- Purity and units keep their standard abbreviations (`22K`, `‰`, `ct`) in all languages.
- Hindi uses standard Devanagari orthography; Nepali follows Nepali spelling
  (e.g. चाँदी, गहना) rather than Hindi variants.
- Currency symbols stay `रू` (NP) and `₹` (IN) regardless of UI language.

## Tooling

```bash
npm run i18n:extract   # rewrite en.json from source strings
npm run i18n:check     # print coverage summary
```

The extractor is heuristic: it may pick up non-UI strings and miss interpolated
templates, so coverage numbers are approximate.

## Adding a language

1. Add a catalog file and import it in `i18n.js`.
2. Register the code in `LOCALES` and `CATALOGS`.
3. Add font rules if the script needs a different family.
4. Verify the header toggle, Settings select and `?lang=` override.

Right-to-left scripts are not supported yet.
