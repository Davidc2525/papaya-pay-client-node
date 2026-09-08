export class PapayaWebhookError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PapayaWebhookError';
  }
}

export class SignatureVerificationError extends PapayaWebhookError {
  constructor(message: string) {
    super(message);
    this.name = 'SignatureVerificationError';
  }
}

export class ToleranceExceededError extends PapayaWebhookError {
  constructor(message: string) {
    super(message);
    this.name = 'ToleranceExceededError';
  }
}

export class PayloadParseError extends PapayaWebhookError {
  constructor(message: string) {
    super(message);
    this.name = 'PayloadParseError';
  }
}
