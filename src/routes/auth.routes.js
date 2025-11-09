const express = require ('express')
const userController = require ('../controllers/user.controller')

const router = express.Router()

router.post('/login', userController.login.bind(userController));

//Rute to create a new user
router.post ('/', userController.create.bind(userController))
//Rute to get all users
router.get ('/', userController.findAll)
//Rute to get a user by id
router.get ('/:id', userController.findById)
//Rute to get the saldo of a user
router.get('/saldo/:id', userController.getSaldo.bind(userController));
//Rute to sum or subtract saldo
router.patch('/saldo/:id', userController.updateSaldo.bind(userController));

module.exports = router
