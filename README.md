## interledgerBack — README

Resumen
-------
Este repositorio contiene una API de ejemplo para integrar flujos Open Payments / Interledger desde el backend. Permite solicitar grants, crear incoming payments, generar quotes y (cuando el grant está finalizado) crear outgoing payments. También incluye un pequeño script de ejemplo ESM en src/services/interledger.service.js usado durante el desarrollo.

Estructura principal
-------------------
- src/index.js — arranque de Express, carga de .env, middlewares y binding de rutas.
- src/routes/ — definición de rutas; la ruta principal de interés es src/routes/interledger.routes.js que expone los endpoints bajo /api/interledger.
- src/controllers/interledger.controller.js — implementación de los handlers Express. Aquí se encuentran:
  - requestIncomingGrant — POST /api/interledger/grants/incoming
  - createIncomingPayment — POST /api/interledger/incoming-payments
  - requestQuoteGrant — POST /api/interledger/grants/quote
  - createQuote — POST /api/interledger/quotes
  - requestOutgoingGrant — POST /api/interledger/grants/outgoing
  - continueGrant — POST /api/interledger/grants/:id/continue
  - createOutgoingPayment — POST /api/interledger/outgoing-payments
  - getWalletAddresses — GET /api/interledger/wallets
  - listOutgoingPayments — GET /api/interledger/outgoing-payments
  - listIncomingPayments — GET /api/interledger/incoming-payments
  - runInterledgerService — POST /api/interledger/run-service (orquesta un flujo mínimo y crea un job en memoria para finalizarla)
  - getRunServiceJob — GET /api/interledger/run-service/:jobId (consulta estado del job)
- src/services/interledger.service.js — script ESM de ejemplo que realiza un flujo end-to-end. Puede usarse en desarrollo o para pruebas desde CLI.
- private.key — (opcional) clave privada PEM usada por el createAuthenticatedClient. Si no está en .env, el controlador buscará este fichero en la raíz.

Patrón y decisiones de diseño
----------------------------
- Se usa @interledger/open-payments para crear clientes autenticados y operar recursos (grant, incomingPayment, quote, outgoingPayment).
- Contenedor de demo en memoria (store dentro del controlador) para mantener grants, pagos y jobs. No persistente — si reinicias el servidor se pierde todo.
- runInterledgerService fue diseñado para no bloquear la petición HTTP en espera de aprobaciones interactivas. Crea un job en memoria y lanza un worker asíncrono que intentará grant.continue y crear el outgoingPayment. Si el grant requiere interacción, la respuesta incluye la URL de redirect para que el frontend abra la autorización.

Variables de entorno importantes
-------------------------------
- PORT — puerto del servidor (por defecto 3001).
- client — URL de wallet/client (usada en createAuthenticatedClient).
- sender — URL del wallet remitente (sender wallet address / resource server).
- receiver — URL del wallet receptor (receiver wallet address / resource server).
- key_id — identificador de la clave (kid) para la autenticación.
- private_key — opcional: el contenido PEM de la clave privada (o una versión base64/una-línea que el controlador convertirá a PEM). Si no está, el controlador leerá private.key en la raíz.
- INCOMING_AMOUNT — valor por defecto que runInterledgerService puede usar si no se envía value en el body (p. ej. 50000).

Instalación y ejecución
-----------------------
1) Instalar dependencias:

powershell
cd "C:\Users\Amterdam Luces\Desktop\Interledger HACK\interledgerBack"
npm install


2) Crear .env (ejemplo mínimo):


PORT=3001
client=https://example-wallet.local
sender=https://sender-wallet.local
receiver=https://receiver-wallet.local
key_id=my-key-id
# Opción A: guardar el PEM en la variable
private_key="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
# Opción B: guardar una llave en el archivo `private.key` en la raíz
INCOMING_AMOUNT=50000


3) Ejecutar en modo desarrollo:

powershell
npm run dev


Endpoints clave (resumen)
-------------------------
Prefix: /api/interledger
- POST /grants/incoming — solicita grant para crear incoming payments.
- POST /incoming-payments — crea un incoming payment (necesita grantId, receiverUrl, amount).
- POST /grants/quote — solicita grant para crear quotes.
- POST /quotes — crea quote (necesita grantId, sendingWallet, incomingPaymentUrl).
- POST /grants/outgoing — solicita grant para crear outgoing payments (produce interact.redirect si el auth server pide aprobación).
- POST /grants/:id/continue — ejecuta grant.continue para finalizar un grant que tenga continue info.
- POST /outgoing-payments — crea outgoing payment (necesita grantId, sendingWallet, quoteUrl).
- GET /wallets — obtiene walletAddress para sender y receiver desde los recursos remotos.
- POST /run-service — orquesta flujo mínimo (incoming grant → incoming payment → quote grant → quote → outgoing grant) y crea un job en memoria que intenta finalizar el outgoing grant y crear el outgoing payment. Retorna 202 con { jobId } y, si el grant incluye interacción, también redirect.
- GET /run-service/:jobId — consulta el estado del job (running, completed, pending_approval, failed) y su result.

Comportamiento de run-service
-------------------------------
- Valida value/incomingAmount si se envía en el body (debe ser string numérico entero).
- Realiza operaciones iniciales sin bloquear la petición HTTP y crea un job en store.jobs.
- Worker asíncrono intentará llamar a grant.continue (espera inicial 15s + varios reintentos) y, si el grant queda finalizado, crea el outgoingPayment. Si no queda finalizado y existe interact.redirect, el job queda en pending_approval con redirect en el resultado.

Errores comunes y pasos de depuración
-----------------------------------
- TypeError: argument handler must be a function al iniciar: generalmente significa que una ruta está definida con un handler que no existe o no es función. Verifica src/routes/interledger.routes.js y src/controllers/interledger.controller.js.
  - Ejemplo: la ruta /balance referenciaba controller.getBalance, que no existía; eso provocaba ese error. Solución: eliminar la ruta o implementar getBalance en el controlador.
- Problemas con claves privadas:
  - Si usas private_key en .env, el controlador acepta PEM completo o una única línea base64 que convertirá a PEM.
  - Alternativamente, coloca private.key en la raíz del proyecto (formato PEM) y no definas private_key.
- Timeout / flujo detenido en run-service: el flujo Open Payments puede requerir interacción manual (auth server). En ese caso el servicio devuelve la URL redirect y el job quedará en pending_approval hasta que se apruebe. Usa el jobId para consultar el estado.

Pruebas rápidas (PowerShell)
---------------------------
- Llamar al run-service (envía amount):

powershell
Invoke-RestMethod -Method POST -Uri http://localhost:3001/api/interledger/run-service -Body (@{ value = '100000' } | ConvertTo-Json) -ContentType 'application/json'


- Consultar job:

powershell
Invoke-RestMethod -Method GET -Uri http://localhost:3001/api/interledger/run-service/<jobId>


Notas de seguridad y producción
-------------------------------
- El endpoint /run-service y los endpoints que aceptan claves o desencadenan pagos deben protegerse con autenticación y autorización en producción.
- El store en memoria es solo para pruebas. Para producción, use una base de datos o una cola de jobs persistente (Redis, RabbitMQ, DB + worker).
- Evite exponer private_key por HTTP o logs.

Pasos siguientes / mejoras sugeridas
----------------------------------
1. Persistir jobs en una cola/DB para tolerancia a reinicios.
2. Agregar autenticación (JWT/Passport) en el servidor para proteger endpoints sensibles.
3. Implementar webhooks o SSE para notificar al frontend cuando un job se complete.
4. Añadir tests automatizados para los handlers (mockear @interledger/open-payments).

Contacto rápido
---------------
Si quieres, puedo:
- Añadir una implementación básica de getBalance que use el store para sumar pagos.
- Implementar persistencia de jobs usando SQLite/JSON para demo rápido.
- Crear ejemplos más detallados de cURL/PowerShell/Insomnia para cada endpoint.

Fin del README
# interledgerBack