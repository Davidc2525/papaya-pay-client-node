# Papaya Node.js SDK

SDK oficial de Papaya para Node.js escrito en TypeScript. Permite interactuar con la API (ej. consultar Checkouts) y validar de forma segura las firmas criptográficas de los Webhooks.

## Requisitos
- Node.js v18+ (Utiliza la API `fetch` nativa)

## Uso de la Librería

### 1. Cliente API (Checkouts)
Instancia el cliente para comunicarte con la API de Papaya.

```typescript
import { PapayaClient } from 'papaya-pay-client'; // Ajusta el import a tu entorno

const papaya = new PapayaClient({
  apiKey: 'sk_live_...', // Reemplaza con tu API Key real
  // baseUrl: 'http://localhost:80' // Opcional
});

async function run() {
  // Obtener detalles de un checkout
  const checkout = await papaya.checkouts.get('ID_DEL_CHECKOUT');
  
  if (checkout.items) {
    console.log('Ítems comprados:', checkout.items);
  }
}
```

### 2. Validación de Webhooks
Cuando recibas un webhook desde Papaya, usa `constructEvent` pasándole el **cuerpo crudo (raw body)** de la petición para evitar errores de validación de firma.

```typescript
import { constructEvent } from 'papaya-pay-client';

try {
  // rawBody debe ser de tipo string o Buffer
  const event = constructEvent(rawBody, signatureHeader, 'tu_webhook_secret');
  console.log(`Evento ${event.status} para el checkout ${event.checkout_id}`);
} catch (err) {
  console.error("Firma inválida o expirada");
}
```

---

## Correr el Ejemplo (Express)

El ejemplo incluido levanta un servidor Express en el puerto `8181` que tiene implementada la ruta `/webhook` utilizando `express.raw()`. 

1. Ve a la carpeta de Node.js:
   ```bash
   cd libs/nodejs
   ```
2. Instala las dependencias:
   ```bash
   npm install
   npm install -D ts-node express @types/express @types/node
   ```
3. Ejecuta el servidor:
   ```bash
   npx ts-node examples/express.ts
   ```
