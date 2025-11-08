import express from 'express';
import { getConversion } from '../controllers/currency.controller.js';

const router = express.Router();
router.get('/convert', getConversion); // /api/currency/convert?from=USD&to=MXN&amount=100

export default router;
