import express from 'express';
import { createRateLimiter, createIpRateLimiter, createCombinedRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const healthLimiter = createCombinedRateLimiter(
  createRateLimiter({ 
    category: 'public', 
    endpoint: 'health', 
    keyPrefix: 'pub_health'
  }),
  createIpRateLimiter({ category: 'public' })
);

const knowledgeLimiter = createCombinedRateLimiter(
  createRateLimiter({ 
    category: 'public', 
    endpoint: 'knowledge', 
    keyPrefix: 'pub_knowledge'
  }),
  createIpRateLimiter({ category: 'public' })
);

const catalogLimiter = createCombinedRateLimiter(
  createRateLimiter({ 
    category: 'public', 
    endpoint: 'catalog', 
    keyPrefix: 'pub_catalog'
  }),
  createIpRateLimiter({ category: 'public' })
);

const rateSyncLimiter = createCombinedRateLimiter(
  createRateLimiter({ 
    category: 'public', 
    endpoint: 'rateSync', 
    keyPrefix: 'pub_ratesync'
  }),
  createIpRateLimiter({ category: 'public' })
);

const jewelryCategories = [
  { id: 'ring', label: 'Rings', category: 'gold' },
  { id: 'necklace', label: 'Necklaces', category: 'gold' },
  { id: 'earring', label: 'Earrings', category: 'gold' },
  { id: 'bracelet', label: 'Bracelets', category: 'gold' },
  { id: 'pendant', label: 'Pendants', category: 'gold' },
  { id: 'bangle', label: 'Bangles', category: 'gold' },
  { id: 'anklet', label: 'Anklets', category: 'silver' },
  { id: 'nosepin', label: 'Nose Pins', category: 'gold' },
  { id: 'maangtikka', label: 'Maang Tikka', category: 'gold' },
  { id: 'earcuff', label: 'Ear Cuffs', category: 'gold' },
  { id: 'brooch', label: 'Brooches', category: 'platinum' },
  { id: 'cufflink', label: 'Cufflinks', category: 'platinum' },
  { id: 'tiepin', label: 'Tie Pins', category: 'platinum' },
  { id: 'watch', label: 'Watches', category: 'platinum' },
  { id: 'coin', label: 'Gold Coins', category: 'gold' },
  { id: 'bar', label: 'Gold Bars', category: 'gold' },
  { id: 'loose-diamond', label: 'Loose Diamonds', category: 'diamond' },
  { id: 'loose-gemstone', label: 'Loose Gemstones', category: 'gemstone' },
  { id: 'pearl', label: 'Pearls', category: 'gemstone' },
];

const metals = ['Gold', 'Silver', 'Platinum', 'Rose Gold', 'White Gold', 'Two-Tone', 'Tri-Color'];
const purities = ['24K', '22K', '21K', '20K', '18K', '14K', '12K', '9K', '999', '925', '950', 'PT950', 'PT900', 'PT850'];
const units = ['gram', 'tola', 'kg', 'pennyweight', 'ounce'];

router.get('/health', healthLimiter, (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

router.get('/knowledge/search', knowledgeLimiter, (req, res) => {
  const { q, category, limit = 20 } = req.query;
  res.json({
    success: true,
    results: [
      { id: '1', title: 'Gold Purity Standards', category: 'metals', content: 'Information about gold purity...' },
      { id: '2', title: 'Gemstone Identification', category: 'gemstones', content: 'How to identify gemstones...' },
    ].filter(r => !q || r.title.toLowerCase().includes(q.toLowerCase())).slice(0, Number(limit)),
  });
});

router.get('/knowledge/categories', knowledgeLimiter, (req, res) => {
  res.json({
    success: true,
    categories: ['metals', 'gemstones', 'processes', 'standards', 'measurements', 'currencies'],
  });
});

router.get('/catalog/categories', catalogLimiter, (req, res) => {
  res.json({ success: true, categories: jewelryCategories });
});

router.get('/catalog/metals', catalogLimiter, (req, res) => {
  res.json({ success: true, metals });
});

router.get('/catalog/purities', catalogLimiter, (req, res) => {
  res.json({ success: true, purities });
});

router.get('/catalog/units', catalogLimiter, (req, res) => {
  res.json({ success: true, units });
});

router.post('/rates/sync', rateSyncLimiter, (req, res) => {
  const { url, goldPath, silverPath, unit } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Bad Request', message: 'Rate source URL is required' });
  }

  res.json({
    success: true,
    message: 'Rate sync initiated',
    config: { url, goldPath: goldPath || 'gold', silverPath: silverPath || 'silver', unit: unit || 'tola' },
  });
});

export default router;