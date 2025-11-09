const CurrencyService = require('../services/currency.service');
const service = new CurrencyService();

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

//Creacion de clase para el controlador de currency (si se requiere mas adelante)

class CurrencyController {
    async create (req, res) {
        try {
            const currencyResult = req.body;
            const newCurrency = await service.create(currencyResult);
            res.status(201).json(newCurrency);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al crear la moneda' });
        }
    }
    async findAll (req, res) {
        try {
            const allCurrencies = await service.findAll();
            res.status(200).json(allCurrencies);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al obtener las monedas' });
        }
    }
    async findById (req, res) {
        try {
            const { id } = req.params;
            const currency = await service.findById(id);
            if (!currency) {
                return res.status(404).json({ error: 'Currency not found' });
            }
            res.status(200).json(currency);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Error al obtener la moneda' });
        }
    }
}

module.exports = CurrencyController;