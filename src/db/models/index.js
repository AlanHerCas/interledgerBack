const {Business, businessSchema} = require('./business.model');
const {Currency, currencySchema} = require('./currency.model');
const {Transaction, TRANSACTION_SCHEMA} = require('./transaction.model');
const {User, USER_SCHEMA} = require('./user.model');
const {Wallet, WALLET_SCHEMA} = require('./wallet.model');

function setupModels (sequelize) {
  // Initialize all models
  Business.init(businessSchema, Business.config(sequelize));
  Currency.init(currencySchema, Currency.config(sequelize));
  User.init(USER_SCHEMA, User.config(sequelize));
  Wallet.init(WALLET_SCHEMA, Wallet.config(sequelize));
  Transaction.init(TRANSACTION_SCHEMA, Transaction.config(sequelize));

  // Define associations here if needed

  Bussiness.associate (sequelize.models);
  Currency.associate (sequelize.models);
  User.associate (sequelize.models);
  Wallet.associate (sequelize.models);
  Transaction.associate (sequelize.models);

}
module.exports = setupModels;