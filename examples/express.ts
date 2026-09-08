import express, { Request, Response } from 'express';
import { constructEvent, PapayaWebhookError, PapayaClient } from '../src';

const app = express();
const PORT = 8181;

// Inicializamos el cliente para interactuar con la API de Papaya
const papaya = new PapayaClient({
  apiKey: process.env.PAPAYA_API_KEY || 'sk_live_mi_api_key',
  baseUrl: 'http://localhost:80' // Descomentar para pruebas locales
});

// IMPORTANTE: Papaya envía JSON, pero necesitamos el raw string para validar la firma.
// Configuramos Express para que provea el body original como Buffer/String en req.body crudo
// usando express.raw() para la ruta específica del webhook.
app.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response): Promise<void> => {
    const signature = req.header('X-Papaya-Signature');
    const webhookSecret = process.env.PAPAYA_WEBHOOK_SECRET || 'mi_secreto_de_prueba';

    if (!signature) {
      res.status(400).send('Falta el header X-Papaya-Signature');
      return;
    }

    try {
      // 1. Validar firma del webhook y parsear evento
      const event = constructEvent(req.body, signature, webhookSecret);

      console.log(`Recibido evento seguro para checkout_id: ${event.checkout_id}`);
      console.log(`Estado: ${event.status}`);

      if (event.status === 'PAID') {
        // 2. Obtener los detalles completos del checkout desde la API
        console.log('Consultando API de Papaya para obtener los ítems del checkout...');
        const checkoutInfo = await papaya.checkouts.get(event.checkout_id);

        console.log(`Pedido Interno (external_reference): ${checkoutInfo.external_reference}`);
        console.log(`Ítems pagados:`, checkoutInfo.items);

        // 3. Procesar la orden en tu sistema
        // processOrder(checkoutInfo.external_reference, checkoutInfo.items);
      }

      res.status(200).json({ received: true });
    } catch (err) {
      if (err instanceof PapayaWebhookError) {
        console.error(`⚠️  Validación del Webhook falló: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
      }

      console.error('Error interno procesando webhook', err);
      res.status(500).send('Error interno del servidor');
    }
  }
);

app.listen(PORT, () => {
  console.log(`Servidor de ejemplo escuchando en el puerto ${PORT}`);
});
