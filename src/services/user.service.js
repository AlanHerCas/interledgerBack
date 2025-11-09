const { models } = require("../libs/sequelize");

class UserService {
  async create(user) {
    const userCreated = await models.User.create(user);
    console.log(userCreated);
    return userCreated;
  }
  async findAll() {
    const users = await models.User.findAll();
    console.log(users);
    return users;
  }
  async findById(id) {
    const user = await models.User.findOne({
      where: {
        id_user: id,
      },
    });
    console.log(user);
    return user;
  }
  async findByEmail(email) {
    const user = await models.User.findOne({
      where: {
        email: email,
      },
    });
    console.log(user);
    return user;
  }
  //Para obtener el saldo y solo se vea el saldo
  async getSaldo(id_user) {
    const user = await models.User.findOne({
      where: { id_user },
      attributes: ['saldo'], // Solo selecciona el campo 'saldo'
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user.saldo;
  }

  //Para sumar o restar saldo
  async updateSaldo(id_user, amount) {
    const user = await models.User.findOne({
      where: { id_user },
    });

    if (!user) {
      throw new Error("User not found");
    }

    user.saldo = Number(user.saldo) + Number(amount);
    await user.save();
    return user;
  }
}

module.exports = UserService;
