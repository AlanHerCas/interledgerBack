const {DataTypes, Model} = require('sequelize');

const CURRENCY_VARIABLE = 'currency';

const currencySchema = {
    id_currency: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    code: { // ISO para la moneda ya sea USD, EUR, MXN, etc
        type: DataTypes.STRING,
        allowNull: false
    },
    created_at: { // Es para llevar el control de cuando se creo la moneda
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: { // Es para llevar el control de cuando se actualizo la moneda
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
};

class Currency extends Model {
    static config (sequelize) {
        return {
            sequelize,
            tableName: CURRENCY_VARIABLE,
            modelName: 'Currency',
            timestamps: false
        };
    }
}

module.exports = {CURRENCY_VARIABLE, currencySchema, Currency};
