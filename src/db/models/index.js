const {Business, businessSchema} = require('./business.model');
const {Currency, currencySchema} = require('./currency.model');
const {Transaction, transactionSchema} = require('./transaction.model');
const {User, userSchema} = require('./user.model');
const {Wallet, walletSchema} = require('./wallet.model');

function setupModels (sequelize) {
  // Initialize all models
  Business.init(businessSchema, Business.config(sequelize));
  Currency.init(currencySchema, Currency.config(sequelize));
  User.init(userSchema, User.config(sequelize));
  Wallet.init(walletSchema, Wallet.config(sequelize));
  Transaction.init(transactionSchema, Transaction.config(sequelize));

  // Define associations here if needed
/*
  Business.associate(sequelize.models);
  Currency.associate(sequelize.models);
  User.associate(sequelize.models);
  Wallet.associate(sequelize.models);
  Transaction.associate(sequelize.models);
*/
}
module.exports = setupModels;