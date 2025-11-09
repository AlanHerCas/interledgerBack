const BusinessService = require('../services/business.service');
const service = new BusinessService();

class BusinessController {
    async create (req, res) {
        try{
            const businessData = req.body;
            const newBusiness = await service.create(businessData);
            res.status(201).json(newBusiness);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
    async finByUserId (req, res) {
        try{
            const { id_user } = req.params;
            const businesses = await service.findByUserId(id_user);
            if (businesses.length === 0) { //Verifica si esta vacio el arreglo
                return res.status(404).json({ error: 'No businesses found for this user' });
            }
            res.status(200).json(businesses);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = BusinessController;
