import express from 'express';
import { simulatePayment } from '../controllers/payment.controller.js';

const router = express.Router();

router.post('/simulate', simulatePayment);

export default router;