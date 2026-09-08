import * as crypto from 'crypto';
import { WebhookEvent } from './types';
import {
  SignatureVerificationError,
  ToleranceExceededError,
  PayloadParseError,
} from './errors';

const DEFAULT_TOLERANCE_SECONDS = 300; // 5 minutos

/**
 * Valida y parsea el evento de Webhook de Papaya de forma segura.
 * 
 * @param rawPayload - El cuerpo de la petición HTTP en formato crudo (string o Buffer).
 * @param signatureHeader - El valor del header X-Papaya-Signature.
 * @param secret - El webhook secret proporcionado en el panel de Papaya.
 * @param tolerance - Tiempo en segundos permitido de diferencia con el timestamp del header (previene ataques de repetición).
 * @returns El objeto WebhookEvent parseado y validado.
 */
export function constructEvent(
  rawPayload: string | Buffer,
  signatureHeader: string,
  secret: string,
  tolerance: number = DEFAULT_TOLERANCE_SECONDS
): WebhookEvent {
  // 1. Extraer timestamp (t) y firma (v1)
  const signatureParts = signatureHeader.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=');
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, string>);

  const timestampStr = signatureParts['t'];
  const signatureV1 = signatureParts['v1'];

  if (!timestampStr || !signatureV1) {
    throw new SignatureVerificationError(
      'Header de firma inválido. Formato esperado: t=<timestamp>,v1=<firma>'
    );
  }

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    throw new SignatureVerificationError('El timestamp de la firma no es un número válido.');
  }

  // 2. Validar Tolerancia
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > tolerance) {
    throw new ToleranceExceededError(
      `El timestamp de la firma está fuera de la tolerancia permitida (${tolerance}s).`
    );
  }

  // 3. Calcular el hash esperado
  const payloadStr = Buffer.isBuffer(rawPayload) ? rawPayload.toString('utf8') : rawPayload;
  const signedPayload = `${timestamp}.${payloadStr}`;
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  // 4. Comparación Segura (Constant-Time Compare)
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  const actualBuffer = Buffer.from(signatureV1, 'hex');

  if (
    expectedBuffer.length !== actualBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  ) {
    throw new SignatureVerificationError('La firma proveída no coincide con el payload.');
  }

  // 5. Parseo Seguro del JSON
  try {
    return JSON.parse(payloadStr) as WebhookEvent;
  } catch (error) {
    throw new PayloadParseError('El cuerpo del webhook no es un JSON válido.');
  }
}
