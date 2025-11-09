const express = require('express');
const authRouter = require('./auth.routes');

function routerApi(app) {
    const router = express.Router();
    app.use ('/api', router);
    router.use('/auth', authRouter);
}

module.exports = routerApi;