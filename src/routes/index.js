const express = require('express');
const authRouter = require('./auth.routes');
const interledgerRouter = require('./interledger.routes');
const businessRouter = require('./business.routes');

function routerApi(app) {
    const router = express.Router();
    app.use('/api', router);
    router.use('/auth', authRouter);
    router.use('/business', businessRouter);
    router.use('/interledger', interledgerRouter);
}

module.exports = routerApi;