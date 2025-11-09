const {DataTypes, Model} = require('sequelize');

const WALLET_VARIABLE = 'wallet';
const walletSchema  = {
    id_wallet: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    interledger_address: { //Dirección interledger asociada a la wallet
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    balance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    currency: { //Moneda del balance
        type: DataTypes.STRING,
        allowNull: false
    },
    created_at: { // Es para llevar el control de cuando se creo la wallet
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: { // Es para llevar el control de cuando se actualizo la wallet
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
};

class Wallet extends Model {
    static config (sequelize) {
        return {
            sequelize,
            tableName: WALLET_VARIABLE,
            modelName: 'Wallet',
            timestamps: false
        };
    }
}

module.exports = {WALLET_VARIABLE, walletSchema, Wallet};
