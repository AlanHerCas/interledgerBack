const { models } = require('../libs/sequelize');

class BusinessService {

    async create (business) {
        const businessCreated = await models.Business.create(business);
        console.log (businessCreated);
        return businessCreated;
    }

    async findByUserId(id_user) {
        try {
            const businesses = await models.Business.findAll({
                where: { id_user }
    });
            const user = await models.User.findOne({
                where: { id_user },
                attributes: ['id_user', 'name', 'email']
            });
            return {
                user,
                businesses
            };
        } catch (error) {
            console.error('Error al buscar negocios y usuario:', error);
            throw error;
        }
    }
}

module.exports = BusinessService;