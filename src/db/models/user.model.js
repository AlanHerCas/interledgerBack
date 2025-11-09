const {DataTypes, Model} = require('sequelize');

const USER_VARIABLE = 'user';

const userSchema = {

    id_user: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    created_at: { // Es para llevar el control de cuando se creo el usuario
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: { // Es para llevar el control de cuando se actualizo el usuario
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    lenguaje: {
        type: DataTypes.STRING,
        allowNull: true
    },
    type_money: {
        type: DataTypes.STRING,
        allowNull: true
    },
    rol: {
        type: DataTypes.STRING,
        allowNull: false
    },
    key_url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    saldo: {
        type: DataTypes.DECIMAL(20, 8),
        allowNull: false,
        defaultValue: 0.0
    }
};

class User extends Model {
    static config (sequelize) {
        return {
            sequelize,
            tableName: USER_VARIABLE,
            modelName: 'User',
            timestamps: false
        };
    }
}

module.exports = {USER_VARIABLE, userSchema, User};