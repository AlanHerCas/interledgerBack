const {DataTypes, Model }= require('sequelize');

const TRANSACTION_VARIABLE = 'transaction';

const transactionSchema = {
    id_transaction: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    amount: { // Monto de la transacción
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    original_currency: { // Moneda original de la transacción
        type: DataTypes.STRING,
        allowNull: false
    },
    converted_amount: { // Monto convertido
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    converted_currency: { // Moneda a la que se convierte
        type: DataTypes.STRING,
        allowNull: false
    },
    exchange_rate: { // Tasa usada para la conversión
        type: DataTypes.DECIMAL(10, 6),
        allowNull: false
    },
    interledger_id: { // ID de la transacción en la red Interledger para referencia 
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    status: { // Estado de la transacción: pending, completed, failed
        type: DataTypes.STRING,
        allowNull: false
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
};

class Transaction extends Model {
    static config (sequelize) {
        return {
            sequelize,
            tableName: TRANSACTION_VARIABLE,
            modelName: 'Transaction',
            timestamps: false
        };
    }
}

module.exports = {TRANSACTION_VARIABLE, transactionSchema, Transaction};
