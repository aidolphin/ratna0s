import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
app.use(express.json());
app.get('/health', (_req, res) => res.json({ ok: true }));
app.listen(process.env.PORT || 4000, () => console.log('RatnaOS backend running'));
