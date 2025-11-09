const UserService = require("../services/user.service");
const service = new UserService();

class UserController {
  async create(req, res) {
    try {
      const userData = req.body;
      const newUser = await service.create(userData);
      res.status(201).json(newUser);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
  async findAll(req, res) {
    try {
      const users = await service.findAll();
      res.status(200).json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
  async findById(req, res) {
    try {
      const { id } = req.params;
      const user = await service.findById(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.status(200).json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
  //login method
  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await service.findByEmail(email);

      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      res.status(200).json({ message: "Login exitoso", user });
    } catch (error) {
      console.error("Error en login:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }

  async getSaldo(req, res) {
    try {
      const { id } = req.params;
      const saldo = await service.getSaldo(id);
      res.status(200).json({ saldo });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async updateSaldo(req, res) {
    try {
      const { id } = req.params;
      const { amount } = req.body;

      if (amount === undefined) {
        return res.status(400).json({ error: "Falta el campo amount" });
      }

      const monto = Number(amount);
      if (isNaN(monto)) {
        return res.status(400).json({ error: "amount debe ser numérico" });
      }

      const updatedUser = await service.updateSaldo(id, monto);
      res.status(200).json({
        message: "Saldo actualizado correctamente",
        saldo: updatedUser.saldo,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  }
}

module.exports = new UserController();
