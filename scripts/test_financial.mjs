import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toMinorUnits, fromMinorUnits, formatMinorUnits,
  toMilliGrams, fromMilliGrams,
  roundWeight3, roundCurrency2, roundPercent4,
  validatePurity, validateTaxRate, validateMetalRate, validateWeight,
  validateMakingCharge, validateWastagePercent,
  calcFineWeight, calcMetalValue, calcWastageCost, calcMakingCost, calcStoneCost,
  calcItemCost, calcCartTotals, calcInvoiceTotal, calcExchangeValue, calcJobFinancials,
  validateSaleFinancials,
  CURRENCY_MINOR, WEIGHT_MILLI, PURITY_MAX, TAX_RATE_MAX
} from '../financial.js';

// ============================================================
// Integer arithmetic helpers
// ============================================================

test('toMinorUnits converts decimal to integer minor units', () => {
  assert.equal(toMinorUnits(10.50), 1050);
  assert.equal(toMinorUnits(0.01), 1);
  assert.equal(toMinorUnits(100), 10000);
});

test('toMinorUnits rejects negative amounts', () => {
  assert.throws(() => toMinorUnits(-1), /cannot be negative/);
});

test('toMinorUnits rejects non-finite values', () => {
  assert.throws(() => toMinorUnits(NaN), /finite/);
  assert.throws(() => toMinorUnits(Infinity), /finite/);
  assert.throws(() => toMinorUnits('abc'), /finite/);
});

test('fromMinorUnits converts back to decimal', () => {
  assert.equal(fromMinorUnits(1050), 10.5);
  assert.equal(fromMinorUnits(1), 0.01);
});

test('fromMinorUnits rejects non-integers', () => {
  assert.throws(() => fromMinorUnits(1.5), /integer/);
});

test('formatMinorUnits formats correctly', () => {
  assert.equal(formatMinorUnits(1050), '10.50');
  assert.equal(formatMinorUnits(1), '0.01');
  assert.equal(formatMinorUnits(-500), '-5.00');
  assert.equal(formatMinorUnits(10000), '100.00');
});

test('toMilliGrams converts grams to integer milli-grams', () => {
  assert.equal(toMilliGrams(10.5), 10500);
  assert.equal(toMilliGrams(0.001), 1);
});

test('toMilliGrams rejects negative weights', () => {
  assert.throws(() => toMilliGrams(-1), /cannot be negative/);
});

test('roundWeight3 rounds half-up to 3 decimals', () => {
  assert.equal(roundWeight3(10.5555), 10.556);
  assert.equal(roundWeight3(10.5554), 10.555);
  assert.equal(roundWeight3(0), 0);
});

test('roundCurrency2 rounds half-up to 2 decimals', () => {
  assert.equal(roundCurrency2(10.555), 10.56);
  assert.equal(roundCurrency2(10.554), 10.55);
});

test('roundPercent4 rounds half-up to 4 decimals', () => {
  assert.equal(roundPercent4(12.34567), 12.3457);
  assert.equal(roundPercent4(12.34564), 12.3456);
});

// ============================================================
// Input validation
// ============================================================

test('validatePurity accepts valid range 0-24', () => {
  assert.equal(validatePurity(0), 0);
  assert.equal(validatePurity(24), 24);
  assert.equal(validatePurity(22), 22);
  assert.equal(validatePurity(18), 18);
});

test('validatePurity rejects out of range', () => {
  assert.throws(() => validatePurity(-1), /between 0 and 24/);
  assert.throws(() => validatePurity(25), /between 0 and 24/);
  assert.throws(() => validatePurity(NaN), /finite/);
});

test('validateTaxRate accepts valid range 0-100', () => {
  assert.equal(validateTaxRate(0), 0);
  assert.equal(validateTaxRate(100), 100);
  assert.equal(validateTaxRate(13), 13);
});

test('validateTaxRate rejects out of range', () => {
  assert.throws(() => validateTaxRate(-1), /between 0 and 100/);
  assert.throws(() => validateTaxRate(101), /between 0 and 100/);
});

test('validateMetalRate requires positive value', () => {
  assert.equal(validateMetalRate(15000), 15000);
  assert.equal(validateMetalRate(0.01), 0.01);
});

test('validateMetalRate rejects non-positive', () => {
  assert.throws(() => validateMetalRate(0), /positive/);
  assert.throws(() => validateMetalRate(-100), /positive/);
});

test('validateWeight requires non-negative', () => {
  assert.equal(validateWeight(0), 0);
  assert.equal(validateWeight(10.5), 10.5);
});

test('validateWeight rejects negative', () => {
  assert.throws(() => validateWeight(-1), /cannot be negative/);
});

test('validateMakingCharge requires non-negative', () => {
  assert.equal(validateMakingCharge(0), 0);
  assert.equal(validateMakingCharge(500), 500);
});

test('validateMakingCharge rejects negative', () => {
  assert.throws(() => validateMakingCharge(-1), /cannot be negative/);
});

test('validateWastagePercent accepts 0-100', () => {
  assert.equal(validateWastagePercent(0), 0);
  assert.equal(validateWastagePercent(100), 100);
  assert.equal(validateWastagePercent(5.5), 5.5);
});

test('validateWastagePercent rejects out of range', () => {
  assert.throws(() => validateWastagePercent(-1), /between 0 and 100/);
  assert.throws(() => validateWastagePercent(101), /between 0 and 100/);
});

// ============================================================
// Individual calculation functions
// ============================================================

test('calcFineWeight computes netWeight * purity / 24', () => {
  const result = calcFineWeight(10, 22); // 10g * 22/24 = 9.1667g
  assert.ok(result.ok);
  assert.equal(result.result, roundWeight3(10 * 22 / 24));
});

test('calcFineWeight validates inputs', () => {
  const bad = calcFineWeight(-1, 22);
  assert.ok(!bad.ok);
  const bad2 = calcFineWeight(10, 25);
  assert.ok(!bad2.ok);
});

test('calcMetalValue computes fineWeight * rate in minor units', () => {
  const result = calcMetalValue(5, 10000); // 5g * 10000 NPR/g = 50000 NPR = 5000000 minor
  assert.ok(result.ok);
  assert.equal(result.result, toMinorUnits(50000));
});

test('calcMetalValue validates rate', () => {
  const bad = calcMetalValue(5, 0);
  assert.ok(!bad.ok);
});

test('calcWastageCost computes metalValue * pct / 100', () => {
  const result = calcWastageCost(toMinorUnits(10000), 5); // 10000 NPR * 5% = 500 NPR = 50000 minor
  assert.equal(result.result, toMinorUnits(500));
});

test('calcWastageCost validates percent', () => {
  const bad = calcWastageCost(toMinorUnits(10000), 101);
  assert.ok(!bad.ok);
});

test('calcMakingCost converts to minor units', () => {
  assert.equal(calcMakingCost(500), toMinorUnits(500));
  assert.throws(() => calcMakingCost(-1), /cannot be negative/);
});

test('calcStoneCost sums weight*rate + setting', () => {
  const result = calcStoneCost([
    { weight: 1, rate: 1000, setting: 50 },  // 1*1000 + 50 = 1050
    { weight: 2, rate: 500, setting: 25 }    // 2*500 + 25 = 1025
  ]);
  assert.equal(result.result, toMinorUnits(1050 + 1025));
});

test('calcStoneCost validates stone inputs', () => {
  const bad = calcStoneCost([{ weight: -1, rate: 1000, setting: 0 }]);
  assert.ok(!bad.ok);
  const bad2 = calcStoneCost([{ weight: 1, rate: 0, setting: 0 }]);
  assert.ok(!bad2.ok);
});

// ============================================================
// calcItemCost - integrated item cost calculation
// ============================================================

test('calcItemCost computes complete item cost', () => {
  const result = calcItemCost({
    netWeight: 10,
    purity: 22,
    metalRate: 10000,
    wastagePercent: 5,
    makingCharge: 500,
    stoneDetails: [{ weight: 1, rate: 1000, setting: 50 }]
  });
  assert.ok(result.ok);
  const { result: r } = result;
  // fineWeight = 10 * 22/24 = 9.1667g
  // metalValue = 9.1667g * 10000 = 91667 NPR
  // wastageCost = 91667 * 5% = 4583.35 NPR
  // makingCost = 500 NPR
  // stoneCost = 1*1000 + 50 = 1050 NPR
  // total = 91667 + 4583.35 + 500 + 1050 = 98800.35 NPR
  assert.ok(r.totalCostMinor > 0);
  assert.ok(r.metalValueMinor > 0);
  assert.ok(r.wastageCostMinor > 0);
  assert.ok(r.makingCostMinor === toMinorUnits(500));
  assert.ok(r.stoneCostMinor === toMinorUnits(1050));
});

test('calcItemCost rejects missing required fields', () => {
  const bad = calcItemCost({});
  assert.ok(!bad.ok);
  assert.equal(bad.error, 'netWeight is required');
});

test('calcItemCost rejects invalid purity', () => {
  const bad = calcItemCost({ netWeight: 10, purity: 30, metalRate: 10000 });
  assert.ok(!bad.ok);
});

// ============================================================
// calcCartTotals - authoritative cart calculation
// ============================================================

test('calcCartTotals computes subtotal, tax, total', () => {
  const result = calcCartTotals(
    [{ basePrice: 1000, qty: 2, discount: 0 }, { basePrice: 500, qty: 1, discount: 100 }],
    13, true
  );
  assert.ok(result.ok);
  const { result: r } = result;
  // subtotal = 2000 + 500 = 2500 NPR = 250000 minor
  // discount = 100 NPR = 10000 minor
  // taxable = 2400 NPR
  // inclusive: total = round(2400 / 1.13) = 2124 NPR, tax = 2400 - 2124 = 276 NPR
  assert.equal(r.subtotalMinor, toMinorUnits(2500));
  assert.equal(r.discountMinor, toMinorUnits(100));
  assert.equal(r.taxableMinor, toMinorUnits(2400));
});

test('calcCartTotals with exclusive tax', () => {
  const result = calcCartTotals(
    [{ basePrice: 1000, qty: 1, discount: 0 }],
    10, false
  );
  assert.ok(result.ok);
  // taxable = 1000, tax = 1000 * 10% = 100, total = 1100
  assert.equal(result.result.taxMinor, toMinorUnits(100));
  assert.equal(result.result.totalMinor, toMinorUnits(1100));
});

test('calcCartTotals rejects discount exceeding subtotal', () => {
  const result = calcCartTotals(
    [{ basePrice: 100, qty: 1, discount: 200 }],
    13, true
  );
  assert.ok(!result.ok);
});

test('calcCartTotals rejects invalid quantity', () => {
  const result = calcCartTotals(
    [{ basePrice: 100, qty: -1, discount: 0 }],
    13, true
  );
  assert.ok(!result.ok);
});

// ============================================================
// calcInvoiceTotal - authoritative invoice recalculation
// ============================================================

test('calcInvoiceTotal recalculates from items, ignores client total', () => {
  const result = calcInvoiceTotal(
    { id: 'S-001', total: 999999999 }, // client-submitted bogus total
    [{ id: 'I-1', basePrice: 1000, qty: 1, discount: 0, netWeight: 10, purity: 22, metalRate: 10000 }],
    13, true
  );
  assert.ok(result.ok);
  // Total should be recalculated from items, not 999999999
  assert.notEqual(result.result.totalMinor, toMinorUnits(999999999));
  assert.equal(result.result.recalculated, true);
  assert.equal(result.result.source, 'trusted-calculator');
});

test('calcInvoiceTotal requires items', () => {
  const result = calcInvoiceTotal({ id: 'S-001', total: 1000 }, [], 13, true);
  assert.ok(!result.ok);
  assert.equal(result.error, 'At least one item required');
});

test('calcInvoiceTotal rejects invalid quantity', () => {
  const result = calcInvoiceTotal(
    { id: 'S-001', total: 1000 },
    [{ id: 'I-1', basePrice: 1000, qty: 0, discount: 0 }],
    13, true
  );
  assert.ok(!result.ok);
});

// ============================================================
// validateSaleFinancials - integrity check
// ============================================================

test('validateSaleFinancials accepts matching totals', () => {
  const recalced = calcInvoiceTotal(
    { id: 'S-001', total: 0 }, // will be overwritten by recalculation
    [{ id: 'I-1', basePrice: 1000, qty: 1, discount: 0, netWeight: 10, purity: 22, metalRate: 10000 }],
    13, true
  );
  const correctTotal = fromMinorUnits(recalced.result.totalMinor);

  const result = validateSaleFinancials(
    { id: 'S-001', total: correctTotal },
    [{ id: 'I-1', basePrice: 1000, qty: 1, discount: 0, netWeight: 10, purity: 22, metalRate: 10000 }],
    13, true
  );
  assert.ok(result.ok);
  assert.equal(result.errors.length, 0);
});

test('validateSaleFinancials rejects mismatched totals', () => {
  const recalced = calcInvoiceTotal(
    { id: 'S-001', total: 0 },
    [{ id: 'I-1', basePrice: 1000, qty: 1, discount: 0, netWeight: 10, purity: 22, metalRate: 10000 }],
    13, true
  );

  const result = validateSaleFinancials(
    { id: 'S-001', total: 999999 }, // wildly different
    [{ id: 'I-1', basePrice: 1000, qty: 1, discount: 0, netWeight: 10, purity: 22, metalRate: 10000 }],
    13, true
  );
  assert.ok(!result.ok);
  assert.ok(result.errors.length > 0);
  assert.ok(result.errors.some(e => e.includes('mismatch')));
});

test('validateSaleFinancials rejects missing sale ID', () => {
  const result = validateSaleFinancials(
    { total: 100 },
    [{ id: 'I-1', basePrice: 100, qty: 1, discount: 0 }],
    13, true
  );
  assert.ok(!result.ok);
  assert.ok(result.errors.some(e => e.includes('ID')));
});

// ============================================================
// calcExchangeValue - old gold exchange
// ============================================================

test('calcExchangeValue computes net value after deduction', () => {
  const result = calcExchangeValue(10, 22, 10000, 500);
  assert.ok(result.ok);
  const { result: r } = result;
  // fineWeight = 10 * 22/24 = 9.1667g
  // grossValue = 9.1667 * 10000 = 91667 NPR
  // netValue = 91667 - 500 = 91167 NPR
  assert.ok(r.netValueMinor > 0);
  assert.ok(r.grossValueMinor > r.netValueMinor);
  assert.equal(r.deductionMinor, toMinorUnits(500));
});

test('calcExchangeValue never returns negative net value', () => {
  const result = calcExchangeValue(10, 22, 10000, 1000000); // huge deduction
  assert.ok(result.ok);
  assert.equal(result.result.netValueMinor, 0);
  assert.equal(result.result.netValueNpr, 0);
});

test('calcExchangeValue validates inputs', () => {
  const bad = calcExchangeValue(-1, 22, 10000);
  assert.ok(!bad.ok);
  const bad2 = calcExchangeValue(10, 30, 10000);
  assert.ok(!bad2.ok);
});

// ============================================================
// calcJobFinancials - karigar job calculations
// ============================================================

test('calcJobFinancials computes net weight and labour', () => {
  const result = calcJobFinancials({
    issuedWeight: 10,
    returnedWeight: 2,
    labourMethod: 'perGram',
    labourRate: 100
  });
  assert.ok(result.ok);
  // netWeight = 10 - 2 = 8g
  // labour = 8 * 100 = 800 NPR
  assert.equal(result.result.netWeightGrams, 8);
  assert.equal(result.result.labourTotalMinor, toMinorUnits(800));
});

test('calcJobFinancials rejects return exceeding issue', () => {
  const result = calcJobFinancials({
    issuedWeight: 5,
    returnedWeight: 10,
    labourMethod: 'perGram',
    labourRate: 100
  });
  assert.ok(!result.ok);
});

test('calcJobFinancials supports flat labour rate', () => {
  const result = calcJobFinancials({
    issuedWeight: 10,
    returnedWeight: 2,
    labourMethod: 'flat',
    labourRate: 500
  });
  assert.ok(result.ok);
  assert.equal(result.result.labourTotalMinor, toMinorUnits(500));
});

// ============================================================
// Float arithmetic safety - no float drift in currency
// ============================================================

test('toMinorUnits avoids float drift (0.1 + 0.2 problem)', () => {
  // 0.1 + 0.2 = 0.30000000000000004 in float
  const a = toMinorUnits(0.1);  // 10 minor
  const b = toMinorUnits(0.2);  // 20 minor
  const sum = a + b;            // 30 minor (integer math, no drift)
  assert.equal(sum, 30);
  assert.equal(fromMinorUnits(sum), 0.3);
});

test('Currency values remain exact across round trips', () => {
  const original = 1234.56;
  const minor = toMinorUnits(original);
  const back = fromMinorUnits(minor);
  assert.equal(back, original);
});
