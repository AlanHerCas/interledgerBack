import { convertCurrency } from '../services/currency.service.js';
import Currency from '../models/currency.js';

export const getConversion = async (req, res) => {
  try {
    const { from, to, amount } = req.query;
    const conversion = await convertCurrency(from, to, amount);

    // Guarda el registro de la tasa usada
    await Currency.create({
      base_currency: from,
      target_currency: to,
      rate: conversion.rate,
      updated_at: new Date()
    });

    res.json({
      from,
      to,
      amount,
      converted: conversion.result,
      rate: conversion.rate
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener conversión' });
  }
};
