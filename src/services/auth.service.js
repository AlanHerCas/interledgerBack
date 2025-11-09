const { models } = require('../libs/sequelize');

class AuthService {

    async create (user) {
        const userCreated = await models.User.create(user);
        console.log (userCreated);
        return userCreated;
    }
    async findAll () {
        const users = await models.User.findAll();
        console.log (users);
        return users;
    }
    
    async findById (id) {
        const user = await models.User.findOne({ 
            where: {
                id_user: id
            }
        });
        console.log (user);
        return user;
    }
}

module.exports = AuthService;