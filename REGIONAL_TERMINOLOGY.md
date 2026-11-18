# Regional Terminology

Last updated: 2026-11-18 · Source: `knowledge.js` (`REGIONAL_TERMS`, `REGIONAL_COLLECTIONS`) · UI: **Knowledge Center → Regional Config**

## Purpose

Traders, karigars and customers use different words for the same object, and the same
word for different objects across Nepal and India. This table keeps those words
classified so they are never mistaken for units, purity grades or product categories.

## Nepal (NP)

| Term | Nepali | Kind | Note |
| --- | --- | --- | --- |
| Sun | सुन | Material | Spoken word for gold; not a unit |
| Chandi | चाँदी | Material | Spoken word for silver |
| Sunko gahanaa | सुनको गहना | Product | Gold jewellery |
| Chura | चुरा | Product | Bangle |
| Tilhari | तिलहरी | Product | Bridal necklace; distinct from mangalsutra |
| Pote | पोते | Product | Beaded necklace |
| Naugedi | नौगेडी | Product | Nine-bead design; Needs Verification |
| Tola | तोला | Measurement | Mass unit; see MEASUREMENT_STANDARDS.md |

## India (IN)

| Term | Hindi | Kind | Note |
| --- | --- | --- | --- |
| Sona | सोना | Material | Gold |
| Kundan | कुंदन | Product | Gem-set style |
| Polki | पोलकी | Product | Uncut diamond style |
| Jadau | जड़ाऊ | Product | Setting technique |
| Meenakari | मीनाकारी | Process | Enamelling |
| Hallmark | हॉलमार्क | Regulatory | BIS hallmarking term |
| BIS | बीआईएस | Regulatory | Bureau of Indian Standards |
| HUID | HUID | Regulatory | Hallmark unique ID (placeholder integration) |
| Making charges | मेकिंग चार्ज | Trade | Labour charge term |
| Wastage | वेस्टेज | Trade | Metal loss allowance |

## Confusion pairs to avoid

| Pair | Rule |
| --- | --- |
| Karat / carat | Karat = gold purity; carat = gemstone mass. Never interchangeable. |
| Tola / gram | Tola is regional (NP/IN) and traditional; gram is SI. Convert explicitly. |
| Wastage % / wastage weight | Percent is a rate; weight is grams. They are stored separately. |
| Making charge / metal value | Labour is not metal; never fold into the metal rate. |
| Hallmark / certificate | A hallmark mark is not a gemstone certificate. |
| Tilhari / mangalsutra | Different regional products; do not merge categories. |
| Kada / bangle | Kada is a thick rigid regional form; keep as its own type. |

## Usage in the app

- Search covers English, Nepali and Hindi names plus trade keywords.
- Terms render with a region badge and, where required, "Needs Verification".
- Spoken words are excluded from unit conversion and from invoice line descriptions.
- New terms must be added as records, never hardcoded into a page.
