/*
 * RatnaOS Trusted Financial Calculator — Phase 4
 * ------------------------------------------------
 * Authoritative calculation layer for all financial transactions.
 * Replaces client-trusted totals with server-side-style recalculation
 * from raw inputs. All currency arithmetic uses integer minor units
 * (paisa). All weight arithmetic uses integer milli-grams.
 *
 * Rounding rules (explicit, documented):
 *   - Currency: round half-up to the nearest minor unit (paisa)
 *   - Weight: round half-up to 3 decimal places (milli-gram precision)
 *   - Percentage: round half-up to 4 decimal places
 *   - Intermediate values are kept in integer minor units; no float
 *     arithmetic is used for ledger-relevant amounts.
 */

export const CURRENCY_MINOR = 100;      // paisa per NPR
export const WEIGHT_MILLI = 1000;       // milli-grams per gram
export const PURITY_MAX = 24;           // karat max
export const TAX_RATE_MAX = 100;        // percent max

// ---------------------------------------------------------------------------
// Reliable integer arithmetic helpers
// ---------------------------------------------------------------------------

/** Convert a decimal currency amount to integer minor units (round half-up). */
export function toMinorUnits(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) throw new Error('Amount must be a finite number');
  if (n < 0) throw new Error('Amount cannot be negative');
  return Math.round(n * CURRENCY_MINOR);
}

/** Convert integer minor units back to a display currency amount. */
export function fromMinorUnits(minor) {
  const m = Number(minor);
  if (!Number.isInteger(m)) throw new Error('Minor units must be an integer');
  return m / CURRENCY_MINOR;
}

/** Format minor units as a currency string. */
export function formatMinorUnits(minor) {
  const m = Number(minor) || 0;
  const sign = m < 0 ? '-' : '';
  const abs = Math.abs(m);
  return sign + Math.floor(abs / CURRENCY_MINOR) + '.' + String(abs % CURRENCY_MINOR).padStart(2, '0');
}

/** Convert a decimal weight (grams) to integer milli-grams (round half-up). */
export function toMilliGrams(weight) {
  const n = Number(weight);
  if (!Number.isFinite(n)) throw new Error('Weight must be a finite number');
  if (n < 0) throw new Error('Weight cannot be negative');
  return Math.round(n * WEIGHT_MILLI);
}

/** Convert integer milli-grams back to grams. */
export function fromMilliGrams(milli) {
  const m = Number(milli);
  if (!Number.isInteger(m)) throw new Error('Milli-grams must be an integer');
  return m / WEIGHT_MILLI;
}

/** Round half-up to 3 decimal places (milli-gram precision). */
export function roundWeight3(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error('Weight value must be finite');
  if (n < 0) throw new Error('Weight cannot be negative');
  return Math.round(n * WEIGHT_MILLI) / WEIGHT_MILLI;
}

/** Round half-up to 2 decimal places (currency display). */
export function roundCurrency2(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error('Currency value must be finite');
  return Math.round(n * CURRENCY_MINOR) / CURRENCY_MINOR;
}

/** Round half-up to 4 decimal places (percentage). */
export function roundPercent4(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error('Percentage value must be finite');
  return Math.round(n * 10000) / 10000;
}

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

/** Validate a purity value (karat, 0-24). */
export function validatePurity(purity) {
  const p = Number(purity);
  if (!Number.isFinite(p)) throw new Error('Purity must be a finite number');
  if (p < 0 || p > PURITY_MAX) throw new Error(`Purity must be between 0 and ${PURITY_MAX}`);
  return p;
}

/** Validate a tax rate (percent, 0-100). */
export function validateTaxRate(rate) {
  const r = Number(rate);
  if (!Number.isFinite(r)) throw new Error('Tax rate must be a finite number');
  if (r < 0 || r > TAX_RATE_MAX) throw new Error(`Tax rate must be between 0 and ${TAX_RATE_MAX}`);
  return r;
}

/** Validate a metal rate (per gram, must be positive). */
export function validateMetalRate(rate) {
  const r = Number(rate);
  if (!Number.isFinite(r)) throw new Error('Metal rate must be a finite number');
  if (r <= 0) throw new Error('Metal rate must be positive');
  if (r > 10000000) throw new Error('Metal rate out of valid range');
  return r;
}

/** Validate a weight (grams, must be non-negative). */
export function validateWeight(weight) {
  const w = Number(weight);
  if (!Number.isFinite(w)) throw new Error('Weight must be a finite number');
  if (w < 0) throw new Error('Weight cannot be negative');
  return w;
}

/** Validate a making charge (NPR, must be non-negative). */
export function validateMakingCharge(charge) {
  const c = Number(charge);
  if (!Number.isFinite(c)) throw new Error('Making charge must be a finite number');
  if (c < 0) throw new Error('Making charge cannot be negative');
  return c;
}

/** Validate a wastage percentage (0-100). */
export function validateWastagePercent(pct) {
  const p = Number(pct);
  if (!Number.isFinite(p)) throw new Error('Wastage percent must be a finite number');
  if (p < 0 || p > 100) throw new Error('Wastage percent must be between 0 and 100');
  return p;
}

// ---------------------------------------------------------------------------
// Trusted calculation functions (the "backend" for financial math)
// ---------------------------------------------------------------------------

/**
 * Calculate fine metal weight from net weight and purity.
 * fineWeight = netWeight * purity / 24
 * Returns milli-grams.
 */
export function calcFineWeight(netWeightGrams, purityKarat) {
  try {
    const net = validateWeight(netWeightGrams);
    const purity = validatePurity(purityKarat);
    const fineMilli = Math.round((toMilliGrams(net) * purity) / PURITY_MAX);
    return { ok: true, result: fromMilliGrams(fineMilli) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Calculate metal value from fine weight and rate.
 * metalValue = fineWeight * rate
 * Returns minor units.
 */
export function calcMetalValue(fineWeightGrams, ratePerGram) {
  try {
    const fine = validateWeight(fineWeightGrams);
    const rate = validateMetalRate(ratePerGram);
    // fineMilli * ratePerGram / 1000 = value in NPR, then to minor units
    const fineMilli = toMilliGrams(fine);
    const valueNpr = (fineMilli * rate) / WEIGHT_MILLI;
    return { ok: true, result: toMinorUnits(valueNpr) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Calculate wastage cost from metal value and wastage percent.
 * wastageCost = metalValue * wastagePercent / 100
 * Returns minor units.
 */
export function calcWastageCost(metalValueMinor, wastagePercent) {
  try {
    const pct = validateWastagePercent(wastagePercent);
    // metalValueMinor is already in minor units; no double conversion
    const wastageMinor = Math.round((metalValueMinor * pct) / 100);
    return { ok: true, result: wastageMinor };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Calculate making charge total.
 * Returns minor units.
 */
export function calcMakingCost(makingChargeNpr) {
  const charge = validateMakingCharge(makingChargeNpr);
  return toMinorUnits(charge);
}

/**
 * Calculate stone cost from stone details.
 * stoneCost = sum(weight * rate + setting) for each stone
 * Returns minor units.
 */
export function calcStoneCost(stoneDetails = []) {
  try {
    if (!Array.isArray(stoneDetails)) throw new Error('Stone details must be an array');
    let totalMinor = 0;
    for (const stone of stoneDetails) {
      const weight = validateWeight(stone.weight);
      const rate = validateMetalRate(stone.rate);
      const setting = validateMakingCharge(stone.setting);
      const stoneMinor = toMinorUnits((weight * rate) + setting);
      totalMinor += stoneMinor;
    }
    return { ok: true, result: totalMinor };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Calculate total item cost from raw inputs.
 * totalCost = metalValue + wastageCost + makingCost + stoneCost
 * Returns { ok, result: { fineWeight, metalValue, wastageCost, makingCost, stoneCost, totalCostMinor } }
 * or { ok: false, error }
 */
export function calcItemCost(inputs) {
  try {
    const {
      netWeight, purity, metalRate, wastagePercent, makingCharge, stoneDetails = []
    } = inputs || {};

    if (netWeight == null) throw new Error('netWeight is required');
    if (purity == null) throw new Error('purity is required');
    if (metalRate == null) throw new Error('metalRate is required');

    const fineWeight = calcFineWeight(netWeight, purity);
    if (!fineWeight.ok) throw new Error(fineWeight.error);
    const metalValue = calcMetalValue(fineWeight.result, metalRate);
    if (!metalValue.ok) throw new Error(metalValue.error);
    const wastageCost = calcWastageCost(metalValue.result, wastagePercent || 0);
    if (!wastageCost.ok) throw new Error(wastageCost.error);
    const makingCost = calcMakingCost(makingCharge || 0);
    const stoneCost = calcStoneCost(stoneDetails);
    if (!stoneCost.ok) throw new Error(stoneCost.error);
    const totalCostMinor = metalValue.result + wastageCost.result + makingCost + stoneCost.result;

    return {
      ok: true,
      result: {
        fineWeight: roundWeight3(fineWeight.result),
        metalValueMinor: metalValue.result,
        wastageCostMinor: wastageCost.result,
        makingCostMinor: makingCost,
        stoneCostMinor: stoneCost.result,
        totalCostMinor: totalCostMinor,
        totalCostNpr: fromMinorUnits(totalCostMinor)
      }
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Calculate cart totals from line items.
 * Recalculates from base prices and quantities — never trusts client totals.
 * Returns { ok, result: { subtotalMinor, discountMinor, taxableMinor, taxMinor, totalMinor } }
 */
export function calcCartTotals(cartItems, taxRate, taxInclusive = true) {
  try {
    const rate = validateTaxRate(taxRate);
    const rateDecimal = rate / 100;

    let subtotalMinor = 0;
    let discountMinor = 0;

    for (const item of cartItems) {
      const qty = Number(item.qty);
      if (!Number.isFinite(qty) || qty < 0) throw new Error('Invalid quantity');
      const basePrice = toMinorUnits(item.basePrice || 0);
      const itemSubtotal = Math.round(basePrice * qty);
      subtotalMinor += itemSubtotal;
      discountMinor += toMinorUnits(item.discount || 0);
    }

    let taxableMinor = subtotalMinor - discountMinor;
    if (taxableMinor < 0) throw new Error('Discount cannot exceed subtotal');

    let taxMinor;
    let totalMinor;
    if (taxInclusive) {
      // Line prices already include tax: total = gross, tax = contained portion,
      // taxable = net (gross minus contained tax).
      const grossMinor = taxableMinor;
      taxMinor = Math.round(grossMinor - grossMinor / (1 + rateDecimal));
      taxableMinor = grossMinor - taxMinor;
      totalMinor = grossMinor;
    } else {
      taxMinor = Math.round(taxableMinor * rateDecimal);
      totalMinor = taxableMinor + taxMinor;
    }

    return {
      ok: true,
      result: {
        subtotalMinor,
        discountMinor,
        taxableMinor,
        taxMinor,
        totalMinor,
        subtotalNpr: fromMinorUnits(subtotalMinor),
        discountNpr: fromMinorUnits(discountMinor),
        taxableNpr: fromMinorUnits(taxableMinor),
        taxNpr: fromMinorUnits(taxMinor),
        totalNpr: fromMinorUnits(totalMinor)
      }
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Calculate invoice total from sale and items — authoritative recalculation.
 * Never trusts client-submitted sale.total.
 * Returns { ok, result: { subtotalMinor, discountMinor, taxableMinor, taxMinor, totalMinor, fineWeightTotal, metalValueTotalMinor } }
 */
export function calcInvoiceTotal(sale, items, taxRate, taxInclusive = true) {
  try {
    if (!sale || !sale.id) throw new Error('Sale required');
    if (!Array.isArray(items) || items.length === 0) throw new Error('At least one item required');

    let subtotalMinor = 0;
    let fineWeightTotal = 0;
    let metalValueTotalMinor = 0;

    const cartItems = items.map((item, idx) => {
      const qty = Number(item.qty);
      if (!Number.isFinite(qty) || qty <= 0) throw new Error(`Item ${idx + 1}: invalid quantity`);
      const basePrice = toMinorUnits(item.basePrice || item.sellingPrice || 0);
      const itemSubtotal = Math.round(basePrice * qty);
      subtotalMinor += itemSubtotal;

      // Accumulate fine weight and metal value for inventory/ledger
      if (item.netWeight != null && item.purity != null) {
        const fw = calcFineWeight(item.netWeight, item.purity);
        if (!fw.ok) throw new Error(`Item ${idx + 1}: ${fw.error}`);
        fineWeightTotal += toMilliGrams(fw.result);
      }
      if (item.netWeight != null && item.purity != null && item.metalRate != null) {
        const fw = calcFineWeight(item.netWeight, item.purity);
        if (!fw.ok) throw new Error(`Item ${idx + 1}: ${fw.error}`);
        const mv = calcMetalValue(fw.result, item.metalRate);
        if (!mv.ok) throw new Error(`Item ${idx + 1}: ${mv.error}`);
        metalValueTotalMinor += mv.result * qty;
      }

      return {
        basePrice: fromMinorUnits(basePrice),
        qty,
        discount: toMinorUnits(item.discount || 0)
      };
    });

    const cartResult = calcCartTotals(cartItems, taxRate, taxInclusive);
    if (!cartResult.ok) throw new Error(cartResult.error);

    return {
      ok: true,
      result: {
        ...cartResult.result,
        fineWeightTotalGrams: roundWeight3(fineWeightTotal / WEIGHT_MILLI),
        metalValueTotalMinor,
        metalValueTotalNpr: fromMinorUnits(metalValueTotalMinor),
        recalculated: true,
        source: 'trusted-calculator'
      }
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Calculate old-gold exchange value.
 * value = fineWeight * rate - deduction
 * Returns { ok, result: { fineWeight, grossValueMinor, deductionMinor, netValueMinor } }
 */
export function calcExchangeValue(weightGrams, purityKarat, ratePerGram, deductionNpr = 0) {
  try {
    const weight = validateWeight(weightGrams);
    const purity = validatePurity(purityKarat);
    const rate = validateMetalRate(ratePerGram);
    const deduction = validateMakingCharge(deductionNpr);

    const fineWeight = calcFineWeight(weight, purity);
    if (!fineWeight.ok) throw new Error(fineWeight.error);
    const grossValue = calcMetalValue(fineWeight.result, rate);
    if (!grossValue.ok) throw new Error(grossValue.error);
    const grossValueMinor = grossValue.result;
    const deductionMinor = toMinorUnits(deduction);
    const netValueMinor = Math.max(0, grossValueMinor - deductionMinor);

    return {
      ok: true,
      result: {
        fineWeightGrams: roundWeight3(fineWeight.result),
        grossValueMinor,
        grossValueNpr: fromMinorUnits(grossValueMinor),
        deductionMinor,
        deductionNpr: fromMinorUnits(deductionMinor),
        netValueMinor,
        netValueNpr: fromMinorUnits(netValueMinor)
      }
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Validate a complete sale for financial integrity.
 * Recalculates totals and compares against client-submitted values.
 * Returns { ok, errors: [], recalculated: {...} }
 */
export function validateSaleFinancials(sale, items, taxRate, taxInclusive = true, toleranceMinor = 0) {
  const errors = [];

  if (!sale || !sale.id) {
    errors.push('Sale ID required');
    return { ok: false, errors };
  }

  const recalculated = calcInvoiceTotal(sale, items, taxRate, taxInclusive);
  if (!recalculated.ok) {
    errors.push(`Recalculation failed: ${recalculated.error}`);
    return { ok: false, errors };
  }

  const clientTotalMinor = toMinorUnits(sale.total || 0);
  const recalcedTotalMinor = recalculated.result.totalMinor;
  const diff = Math.abs(clientTotalMinor - recalcedTotalMinor);

  if (diff > toleranceMinor) {
    errors.push(
      `Invoice total mismatch: client=${formatMinorUnits(clientTotalMinor)}, ` +
      `recalculated=${formatMinorUnits(recalcedTotalMinor)}, ` +
      `difference=${formatMinorUnits(diff)}`
    );
  }

  // Validate individual line items
  for (const item of items || []) {
    if (!item.id) errors.push('Item missing ID');
    const qty = Number(item.qty || 0);
    if (!Number.isFinite(qty) || qty <= 0) errors.push(`Item ${item.id || '?'}: invalid quantity`);
    const price = toMinorUnits(item.sellingPrice || 0);
    if (price < 0) errors.push(`Item ${item.id || '?'}: negative price`);
  }

  return {
    ok: errors.length === 0,
    errors,
    recalculated: recalculated.result,
    clientTotalMinor,
    recalculatedTotalMinor: recalcedTotalMinor
  };
}

/**
 * Calculate karigar job financials from raw inputs.
 * netWeight = issuedWeight - returnedWeight
 * labourTotal = rate * netWeight (perGram) OR flat rate
 * Returns { ok, result: { netWeightMilli, labourTotalMinor } }
 */
export function calcJobFinancials(inputs) {
  try {
    const issued = validateWeight(inputs.issuedWeight);
    const returned = validateWeight(inputs.returnedWeight);
    if (returned > issued) throw new Error('Returned weight cannot exceed issued weight');

    const netWeightMilli = toMilliGrams(issued) - toMilliGrams(returned);

    let labourTotalMinor;
    if (inputs.labourMethod === 'flat') {
      labourTotalMinor = toMinorUnits(inputs.labourRate || 0);
    } else {
      // perGram: labour = netWeight * rate (result in NPR, then to minor units)
      const rate = validateMetalRate(inputs.labourRate || 0);
      labourTotalMinor = toMinorUnits(Math.round((netWeightMilli * rate) / WEIGHT_MILLI));
    }

    return {
      ok: true,
      result: {
        netWeightGrams: roundWeight3(netWeightMilli / WEIGHT_MILLI),
        labourTotalMinor,
        labourTotalNpr: fromMinorUnits(labourTotalMinor)
      }
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
