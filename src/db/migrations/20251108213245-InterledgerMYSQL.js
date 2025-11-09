'use strict';
const { BUSINESS_VARIABLE, businessSchema } = require('../models/business.model');
const { CURRENCY_VARIABLE, currencySchema } = require('../models/currency.model');
const { TRANSACTION_VARIABLE, transactionSchema } = require('../models/transaction.model');
const { USER_VARIABLE, userSchema } = require('../models/user.model');
const { WALLET_VARIABLE, walletSchema } = require('../models/wallet.model');


/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable(BUSINESS_VARIABLE, businessSchema);
    await queryInterface.createTable(CURRENCY_VARIABLE, currencySchema);
    await queryInterface.createTable(TRANSACTION_VARIABLE, transactionSchema);
    await queryInterface.createTable(USER_VARIABLE, userSchema);
    await queryInterface.createTable(WALLET_VARIABLE, walletSchema);


    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  async down (queryInterface, Sequelize) {

    await queryInterface.dropTable(BUSINESS_VARIABLE);
    await queryInterface.dropTable(CURRENCY_VARIABLE);
    await queryInterface.dropTable(TRANSACTION_VARIABLE);
    await queryInterface.dropTable(USER_VARIABLE);
    await queryInterface.dropTable(WALLET_VARIABLE);
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
