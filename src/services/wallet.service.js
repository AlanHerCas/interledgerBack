const { models } = require('../libs/sequelize');

class walletService {
    async create (wallet) {
        const walletCreated = await models.Wallet.create(wallet);
        console.log (walletCreated);
        return walletCreated;
    }
    async findAll () {
        const wallets = await models.Wallet.findAll();
        console.log (wallets);
        return wallets;
    }
    async findById (id) {
        const wallet = await models.Wallet.findOne({ 
            where: {
                id_wallet: id
            }
        });
        return wallet;
    }
}

module.exports = walletService;