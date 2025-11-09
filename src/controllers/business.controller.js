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
    async findAll (req, res) {
        try{
            const businessResults = await service.findAll();
            res.status(200).json(businessResults);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
    async findById (req, res) {
        try{
            const { id } = req.params;
            const business = await service.findById(id);
            if (!business) {
                return res.status(404).json({ error: 'Business not found' });
            }
            res.status(200).json(business);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = BusinessController;
