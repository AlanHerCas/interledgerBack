const { models } = require('../libs/sequelize');

import fetch from 'node-fetch';

export const convertCurrency = async (from, to, amount) => {
  const url = `https://api.exchangerate.host/convert?from=${from}&to=${to}&amount=${amount}`;
  const res = await fetch(url);
  const data = await res.json();
  return { rate: data.info.rate, result: data.result };
};

class CurrencyService {
  
    async create (currency) {
        const currencyCreated = await models.Currency.create(currency);
        console.log (currencyCreated);
        return currencyCreated;
    }
    async findAll () {
        const currencies = await models.Currency.findAll();
        console.log (currencies);
        return currencies;
    }
    async findById (id) {
        const currency = await models.Currency.findOne({ 
            where: {
                id_currency: id
            }
        });
        console.log (currency);
        return currency;
    }
}

module.exports = CurrencyService;
