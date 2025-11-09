const express = require('express');
const authRouter = require('./auth.routes');
const interledgerRouter = require('./interledger.routes');

function routerApi(app) {
    const router = express.Router();
    app.use('/api', router);
    router.use('/auth', authRouter);
    router.use('/interledger', interledgerRouter);
}

module.exports = routerApi;