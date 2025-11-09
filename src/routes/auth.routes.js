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


module.exports = router
