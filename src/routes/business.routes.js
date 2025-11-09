const express = require('express');
const BusinessController = require('../controllers/business.controller');

const router = express.Router();
const controller = new BusinessController();

router.post('/', (req, res) => controller.create(req, res));
router.get('/:id_user', (req, res) => controller.finByUserId(req, res));

module.exports = router;
