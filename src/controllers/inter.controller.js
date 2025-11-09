const  InterService = require('../services/inter.service');
const service = new InterService();
class InterController {
  async crearPagoInternacional(req, res) {
  try {
    // Puedes enviar parámetros personalizados en el body (opcional)
    const {
      sender,
      receiver,
      keyId,
      privateKey,
      walletAddressUrl
    } = req.body;

    // Ejecutar el proceso de pago
    const resultado = await service.procesarPagoInternacional({
      sender,
      receiver,
      keyId,
      privateKey,
      walletAddressUrl,
    });

    // Enviar al cliente la respuesta del servidor Interledger
    return res.status(200).json(resultado);

  } catch (error) {
    console.error('❌ Error en crearPagoInternacional:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
};

}

module.exports = InterController;