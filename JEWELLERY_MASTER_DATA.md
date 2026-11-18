# Jewellery Master Data

Last updated: 2026-11-18 · Source: `knowledge.js` · UI: **Knowledge Center → Catalogue**

## Scope

Reference catalogue used for item classification, counting and search. It does not
create inventory records and does not price anything. Inventory items keep their own
category code; the Knowledge Center is the naming authority behind those codes.

## Categories

| Category | Nepali | Hindi | Types | Examples |
| --- | --- | --- | --- | --- |
| Necklaces | हार | हार | 27 | Choker, Princess, Tilhari, Pote, Mangalsutra, Satlada |
| Earrings | कानका गहना | कान के आभूषण | 14 | Stud, Hoop, Jhumka, Chandbali, Ear cuff |
| Rings | औंठी | अंगूठी | 15 | Solitaire, Eternity, Signet, Gemstone |
| Bangles & Bracelets | चुरा र ब्रेसलेट | चूड़ियाँ और ब्रेसलेट | 15 | Kada, Tennis, Bridal chura, Hinged bangle |
| Other Jewellery | अन्य गहना | अन्य आभूषण | 24 | Anklet, Nath, Maang tikka, Kamarbandh, Brooch, Cufflinks |

**Total: 5 categories, 95 types.**

Type lengths are grouped (choker 35–40 cm, princess 45 cm, matinee 50–55 cm,
opera 70–85 cm) in international practice. These are advisory, not measured values,
and are not yet stored in the data model.

## Regional collections (not interchangeable)

| Collection | Items recorded | Status |
| --- | --- | --- |
| Nepali Traditional | Tilhari, Pote, Naugedi, Dhunge mala, Rudraksha mala | Needs Verification |
| Newari | Sisi mala, Lun swan, Naugedi, Tayo | Needs Verification |
| Himalayan | Ghau box, Dzi bead, Coral and turquoise | Needs Verification |
| Indian Traditional | Kundan, Polki, Jadau, Meenakari, Temple | Reference |
| Rajasthani | Borla, Rakhdi, Aad, Kada | Reference |
| Gujarati | Kundan choker, Patla, Kandora | Reference |
| Bengali | Sita haar, Bauti, Kaan er jhumko | Reference |
| South Indian | Temple necklace, Jhumka, Vanki, Oddiyanam | Reference |
| Maharashtrian | Nath, Thushi, Mundavalya | Reference |
| Punjabi | Jhumka, Chooda, Kaleere | Reference |
| Mughal-inspired | Kundan set, Polki choker, Jadau | Reference |
| Contemporary International | Minimal, Geometric, Statement | Reference |

Regional designs are kept separate on purpose: a *tilhari* is not a mangalsutra and a
*kada* is not a western bangle, even when they occupy the same ERP category.

## Metals

13 metals with symbol and room-temperature density (g/cm³): gold 19.32, silver 10.49,
platinum 21.45, palladium 12.02, copper 8.96, zinc 7.14, nickel 8.91, brass 8.50,
bronze 8.80, rhodium 12.41, titanium 4.51, stainless steel 7.85, aluminium 2.70.

Density is reference data only; it is not used for weight or price arithmetic.

## Gold purity (karat ↔ fineness)

| Karat | Fineness (‰) | Notes |
| --- | --- | --- |
| 24K | 999.9 | Commercial 999/999.9 varies by market |
| 23K | 958 | |
| 22K | 916.7 | Common South Asian jewellery standard |
| 21K | 875 | |
| 20K | 833 | |
| 18K | 750 | |
| 14K | 583.3 | |
| 12K | 500 | |
| 10K | 416.7 | |
| 9K | 375 | |

Karat is purity. **Carat is gemstone mass.** The two words are never interchangeable and
the converter refuses to cross between them.

## Silver standards

999 fine, 958 Britannia (Needs Verification), 925 sterling, 900 coin.

## Gemstones

Not yet implemented as records. Gemstone rates in Materials are free-text entries.
A structured gemstone master (species, treatments, certification, origin) is planned
and will carry verification flags per field.

## Data rules

- Unknown or unverified values carry `needsVerification: true` and render a badge.
- Nothing in this file claims a certificate, assay or legal standard.
- Traders' spoken names (सुन, चाँदी, chura) live in regional terminology, not here.
