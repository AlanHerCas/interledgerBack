const { config } = require('../config/config');

const USER = encodeURIComponent(config.dbUser);
const PASSWORD = encodeURIComponent(config.dbPassword);
const URI = `mysql://${USER}:${PASSWORD}@${config.dbHost}:${config.dbPort}/${config.dbName}`;

console.log(USER);
console.log(PASSWORD);
console.log(URI);

// Exportar la configuración de Sequelize
module.exports = {
  development: {
    url: URI,
    dialect: 'mysql',
  },
  production: {
    url: URI,
    dialect: 'mysql',
  }
};