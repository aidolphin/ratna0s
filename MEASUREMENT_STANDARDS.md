# Measurement Standards

Last updated: 2026-11-18 · Source: `knowledge.js` (`MEASUREMENT_TYPES`, `UNITS`) · UI: **Knowledge Center → Measurements / Converter**

## Measurement types

| Type | Base unit | Rule |
| --- | --- | --- |
| Mass / Weight | gram | Metal weight. Includes regional trade units. |
| Gemstone Weight | carat | Stones only. 1 ct = 0.2 g exactly. |
| Length | millimeter | Dimensions, chain/necklace length, stone diameter. |
| Metal Purity | fineness (‰) | Karat, fineness and percent. |
| Ring Size | circumference (mm) | Sizing; systems partially verified. |
| Count | piece | Simple count. |

Conversion is only allowed **within** one type. Mass ↔ length and karat ↔ carat are
rejected with `type-mismatch`. This is deliberate: the most common ERP error in this
industry is mixing carat and karat or adding a stone mass to a metal mass.

## Unit table (23 units)

### Mass — base gram

| Unit | Abbr | Factor (g) | Scope | Status |
| --- | --- | --- | --- | --- |
| Kilogram | kg | 1000 | International | Verified (SI) |
| Gram | g | 1 | International | Verified (SI) |
| Milligram | mg | 0.001 | International | Verified (SI) |
| Microgram | µg | 0.000001 | International | Verified (SI) |
| Troy ounce | ozt | 31.1034768 | International | Verified |
| Avoirdupois ounce | oz | 28.349523125 | International | Verified |
| Pennyweight | dwt | 1.55517384 | International | Verified |
| Tola | tola | 11.6638 | NP, IN | Regional, verify locally |
| Masha | masha | 0.971983 | NP, IN | Needs Verification (1 tola = 12 masha) |
| Ana | ana | 0.7289875 | NP, IN | Needs Verification (1 tola = 16 ana) |
| Lal | lal | 0.116638 | NP, IN | Needs Verification (1 tola = 100 lal) |
| Ratti | ratti | 0.1215 | NP, IN | Needs Verification (seed weight varies) |

### Gemstone mass — base carat

| Unit | Abbr | Factor (ct) | Notes |
| --- | --- | --- | --- |
| Carat | ct | 1 | Metric carat, 0.2 g |
| Point | pt | 0.01 | 100 points per carat |
| Carat in grams | ct-g | 0.2 | Mass equivalent for stone rows |

### Length — base millimeter

| Unit | Abbr | Factor (mm) |
| --- | --- | --- |
| Millimeter | mm | 1 |
| Centimeter | cm | 10 |
| Meter | m | 1000 |
| Inch | in | 25.4 |

### Purity — base fineness

| Unit | Abbr | Factor to fineness | Notes |
| --- | --- | --- | --- |
| Karat | K | 41.6666666667 | 24K = 1000‰ |
| Fineness | ‰ | 1 | Parts per thousand |
| Purity % | % | 10 | Percent of fine metal |

### Count

Piece (pc), factor 1.

## Traditional units — regional, not universal

Tola, masha, ana, lal and ratti are **South Asian trade conventions**, scoped to NP/IN in
the data. They are traditional, not statutory, and definitions vary by market and by
commodity. The app:

- shows the scope column (`NP, IN`) and a "Regional unit" badge;
- marks masha/ana/lal/ratti "Needs Verification";
- never applies them silently to a country outside their scope.

1 tola = 11.6638 g is the working factor used for Nepal/India trade display. Do not
use it in a contract without counterparty agreement.

## Ring sizes

| System | Status |
| --- | --- |
| ISO circumference (mm) | Verified as a measurement |
| US | Needs Verification — advisory tables only |
| UK | Needs Verification |
| India | Needs Verification (tables vary by region) |
| Japan | Needs Verification |
| Europe | Needs Verification (often mm circumference) |

No ring-size conversion table is shipped yet because inconsistent published tables would
create sizing errors. Measure the actual ring or finger circumference in mm.

## Conversion API

```js
import { convert, convertRounded, karatToFineness, finenessToKarat } from './knowledge.js';

convert(1, 'tola', 'gram');        // { ok: true, value: 11.6638, ... }
convert(22, 'karat', 'fineness');  // { ok: true, value: 916.7, ... }
convert(1, 'carat', 'fineness');   // { ok: false, error: 'type-mismatch' }
karatToFineness(18);               // 750
finenessToKarat(916.7);            // 22
```

`convertRounded` rounds to the target unit's declared precision (max 6 dp).
Non-numeric input returns `invalid-value`; unknown ids return `unknown-unit`.

## Display

- Nepali UI shows Devanagari digits; Hindi and English use Latin digits.
- Converter output uses locale grouping (`ne-NP`, `hi-IN`, `en-US`).
- Weight in inventory continues to use the shop's `weightUnit` setting (gram/tola);
  the Knowledge Center converter is reference tooling and does not rewrite item weights.
