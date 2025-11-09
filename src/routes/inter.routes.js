const express = require('express');
const InterController = require('../controllers/inter.controller'); 
const router = express.Router();

const controller = new InterController();
// POST /api/pagos
router.post('/pagos', controller.crearPagoInternacional);

module.exports = router;
