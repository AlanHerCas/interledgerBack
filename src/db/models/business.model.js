const {DataTypes, Model} = require('sequelize');

const BUSINESS_VARIABLE = 'business';

const businessSchema = {

    id_business: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    address : {
        type: DataTypes.STRING,
        allowNull: true
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    currency: { //Moneda con la que opera el negocio
        type: DataTypes.STRING,
        allowNull: true
    },
    created_at: { // Es para llevar el control de cuando se creo el negocio
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: { // Es para llevar el control de cuando se actualizo el negocio
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    id_user: { // ID del usuario propietario del negocio
        type: DataTypes.INTEGER,
        allowNull: false
    }
};

class Business extends Model {
    static config (sequelize) {
        return {
            sequelize,
            tableName: BUSINESS_VARIABLE,
            modelName: 'Business',
            timestamps: false
        };
    }
}

module.exports = {BUSINESS_VARIABLE, businessSchema, Business};