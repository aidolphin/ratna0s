import express from 'express';
import { createRateLimiter, createIpRateLimiter, createCombinedRateLimiter } from '../middleware/rateLimiter.js';
import { authenticateToken, requireRole } from './auth.js';

const router = express.Router();

const transactions = new Map();
const metalOperations = new Map();
const sales = new Map();
const expenses = new Map();

let transactionId = 0;
let metalOpId = 0;
let saleId = 0;
let expenseId = 0;

const transactionLimiter = createCombinedRateLimiter(
  createRateLimiter({ 
    category: 'financial', 
    endpoint: 'transaction', 
    keyPrefix: 'fin_txn',
    getAccountId: (req) => req.user?.username
  }),
  createIpRateLimiter({ category: 'financial' })
);

const metalOperationLimiter = createCombinedRateLimiter(
  createRateLimiter({ 
    category: 'financial', 
    endpoint: 'metalOperation', 
    keyPrefix: 'fin_metal',
    getAccountId: (req) => req.user?.username
  }),
  createIpRateLimiter({ category: 'financial' })
);

const saleLimiter = createCombinedRateLimiter(
  createRateLimiter({ 
    category: 'financial', 
    endpoint: 'sale', 
    keyPrefix: 'fin_sale',
    getAccountId: (req) => req.user?.username
  }),
  createIpRateLimiter({ category: 'financial' })
);

const expenseLimiter = createCombinedRateLimiter(
  createRateLimiter({ 
    category: 'financial', 
    endpoint: 'expense', 
    keyPrefix: 'fin_expense',
    getAccountId: (req) => req.user?.username
  }),
  createIpRateLimiter({ category: 'financial' })
);

const reportLimiter = createCombinedRateLimiter(
  createRateLimiter({ 
    category: 'financial', 
    endpoint: 'report', 
    keyPrefix: 'fin_report',
    getAccountId: (req) => req.user?.username
  }),
  createIpRateLimiter({ category: 'financial' })
);

router.use(authenticateToken);

router.post('/transactions', transactionLimiter, requireRole('admin', 'manager', 'accountant'), (req, res) => {
  try {
    const { type, amount, description, category, date, reference } = req.body;

    if (!type || !amount || !description || !category) {
      return res.status(400).json({ error: 'Bad Request', message: 'Type, amount, description, and category are required' });
    }

    const transaction = {
      id: ++transactionId,
      type,
      amount: Number(amount),
      description,
      category,
      date: date || new Date().toISOString().split('T')[0],
      reference: reference || '',
      createdBy: req.user.username,
      createdAt: new Date().toISOString(),
    };

    transactions.set(transaction.id, transaction);

    res.status(201).json({ success: true, transaction });
  } catch (err) {
    console.error('Create transaction error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'An error occurred creating the transaction' });
  }
});

router.get('/transactions', reportLimiter, requireRole('admin', 'manager', 'accountant', 'viewer'), (req, res) => {
  try {
    const { startDate, endDate, category, type, limit = 100, offset = 0 } = req.query;
    let result = Array.from(transactions.values());

    if (startDate) result = result.filter(t => t.date >= startDate);
    if (endDate) result = result.filter(t => t.date <= endDate);
    if (category) result = result.filter(t => t.category === category);
    if (type) result = result.filter(t => t.type === type);

    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const paginated = result.slice(Number(offset), Number(offset) + Number(limit));

    res.json({ success: true, transactions: paginated, total: result.length });
  } catch (err) {
    console.error('Get transactions error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'An error occurred retrieving transactions' });
  }
});

router.post('/metal-operations', metalOperationLimiter, requireRole('admin', 'manager', 'production'), (req, res) => {
  try {
    const { type, metal, purity, weight, rate, value, reference, notes, karigar, jobCode } = req.body;

    if (!type || !metal || !purity || !weight) {
      return res.status(400).json({ error: 'Bad Request', message: 'Type, metal, purity, and weight are required' });
    }

    const operation = {
      id: ++metalOpId,
      type,
      metal,
      purity,
      weight: Number(weight),
      rate: Number(rate || 0),
      value: Number(value || 0),
      reference: reference || '',
      notes: notes || '',
      karigar: karigar || '',
      jobCode: jobCode || '',
      createdBy: req.user.username,
      createdAt: new Date().toISOString(),
    };

    metalOperations.set(operation.id, operation);

    res.status(201).json({ success: true, operation });
  } catch (err) {
    console.error('Create metal operation error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'An error occurred creating the metal operation' });
  }
});

router.get('/metal-operations', reportLimiter, requireRole('admin', 'manager', 'production', 'accountant', 'viewer'), (req, res) => {
  try {
    const { metal, purity, type, startDate, endDate, limit = 100, offset = 0 } = req.query;
    let result = Array.from(metalOperations.values());

    if (metal) result = result.filter(o => o.metal === metal);
    if (purity) result = result.filter(o => o.purity === purity);
    if (type) result = result.filter(o => o.type === type);
    if (startDate) result = result.filter(o => o.createdAt >= startDate);
    if (endDate) result = result.filter(o => o.createdAt <= endDate);

    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const paginated = result.slice(Number(offset), Number(offset) + Number(limit));

    res.json({ success: true, operations: paginated, total: result.length });
  } catch (err) {
    console.error('Get metal operations error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'An error occurred retrieving metal operations' });
  }
});

router.post('/sales', saleLimiter, requireRole('admin', 'manager', 'sales'), (req, res) => {
  try {
    const { customerName, items, total, tax, discount, paymentMethod, notes } = req.body;

    if (!customerName || !items || !Array.isArray(items) || items.length === 0 || !total) {
      return res.status(400).json({ error: 'Bad Request', message: 'Customer name, items array, and total are required' });
    }

    const sale = {
      id: ++saleId,
      customerName,
      items,
      total: Number(total),
      tax: Number(tax || 0),
      discount: Number(discount || 0),
      paymentMethod: paymentMethod || 'Cash',
      notes: notes || '',
      createdBy: req.user.username,
      createdAt: new Date().toISOString(),
    };

    sales.set(sale.id, sale);

    res.status(201).json({ success: true, sale });
  } catch (err) {
    console.error('Create sale error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'An error occurred creating the sale' });
  }
});

router.get('/sales', reportLimiter, requireRole('admin', 'manager', 'sales', 'accountant', 'viewer'), (req, res) => {
  try {
    const { customerName, startDate, endDate, limit = 100, offset = 0 } = req.query;
    let result = Array.from(sales.values());

    if (customerName) result = result.filter(s => s.customerName.toLowerCase().includes(customerName.toLowerCase()));
    if (startDate) result = result.filter(s => s.createdAt >= startDate);
    if (endDate) result = result.filter(s => s.createdAt <= endDate);

    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const paginated = result.slice(Number(offset), Number(offset) + Number(limit));

    res.json({ success: true, sales: paginated, total: result.length });
  } catch (err) {
    console.error('Get sales error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'An error occurred retrieving sales' });
  }
});

router.post('/expenses', expenseLimiter, requireRole('admin', 'manager', 'accountant'), (req, res) => {
  try {
    const { category, amount, description, date, paymentMethod, reference, status } = req.body;

    if (!category || !amount || !description) {
      return res.status(400).json({ error: 'Bad Request', message: 'Category, amount, and description are required' });
    }

    const expense = {
      id: ++expenseId,
      category,
      amount: Number(amount),
      description,
      date: date || new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethod || 'Cash',
      reference: reference || '',
      status: status || 'pending',
      createdBy: req.user.username,
      createdAt: new Date().toISOString(),
    };

    expenses.set(expense.id, expense);

    res.status(201).json({ success: true, expense });
  } catch (err) {
    console.error('Create expense error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'An error occurred creating the expense' });
  }
});

router.get('/expenses', reportLimiter, requireRole('admin', 'manager', 'accountant', 'viewer'), (req, res) => {
  try {
    const { category, status, startDate, endDate, limit = 100, offset = 0 } = req.query;
    let result = Array.from(expenses.values());

    if (category) result = result.filter(e => e.category === category);
    if (status) result = result.filter(e => e.status === status);
    if (startDate) result = result.filter(e => e.date >= startDate);
    if (endDate) result = result.filter(e => e.date <= endDate);

    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const paginated = result.slice(Number(offset), Number(offset) + Number(limit));

    res.json({ success: true, expenses: paginated, total: result.length });
  } catch (err) {
    console.error('Get expenses error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'An error occurred retrieving expenses' });
  }
});

router.get('/reports/summary', reportLimiter, requireRole('admin', 'manager', 'accountant'), (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let txns = Array.from(transactions.values());
    let sls = Array.from(sales.values());
    let exps = Array.from(expenses.values());

    if (startDate) {
      txns = txns.filter(t => t.date >= startDate);
      sls = sls.filter(s => s.createdAt >= startDate);
      exps = exps.filter(e => e.date >= startDate);
    }
    if (endDate) {
      txns = txns.filter(t => t.date <= endDate);
      sls = sls.filter(s => s.createdAt <= endDate);
      exps = exps.filter(e => e.date <= endDate);
    }

    const totalSales = sls.reduce((sum, s) => sum + s.total, 0);
    const totalExpenses = exps.reduce((sum, e) => sum + e.amount, 0);
    const totalTransactions = txns.length;

    res.json({
      success: true,
      summary: {
        totalSales,
        totalExpenses,
        netProfit: totalSales - totalExpenses,
        totalTransactions,
        salesCount: sls.length,
        expensesCount: exps.length,
      },
    });
  } catch (err) {
    console.error('Get summary report error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: 'An error occurred generating the report' });
  }
});

export default router;