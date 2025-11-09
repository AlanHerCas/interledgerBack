const { models } = require('../libs/sequelize');

class BusinessService {

    async create (business) {
        const businessCreated = await models.Business.create(business);
        console.log (businessCreated);
        return businessCreated;
    }

    async findAll () {
        const businesses = await models.Business.findAll();
        console.log (businesses);
        return businesses;
    }

    async findById (id) {
        const business = await models.Business.findOne({ 
            where: {
                id_business: id
            }
        });
        console.log (business);
        return business;
    }
}

module.exports = BusinessService;