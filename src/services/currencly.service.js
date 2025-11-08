import fetch from 'node-fetch';

export const convertCurrency = async (from, to, amount) => {
  const url = `https://api.exchangerate.host/convert?from=${from}&to=${to}&amount=${amount}`;
  const res = await fetch(url);
  const data = await res.json();
  return { rate: data.info.rate, result: data.result };
};
