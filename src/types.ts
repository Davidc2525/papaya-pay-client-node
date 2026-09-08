export interface Transaction {
  id: string;
  fee_cents: number;
  net_amount_cents: number;
  paid_currency: string;
}

export interface WebhookEvent {
  app_id: string;
  checkout_id: string;
  status: string;
  transaction: Transaction;
}

export interface CheckoutItem {
  name: string;
  quantity: number;
  unit_price_ves_cents: number;
  unit_price_usdc_cents: number;
}

export interface Checkout {
  id?: string | null;
  app_id?: string | null;
  external_reference?: string | null;
  amount_ves_cents?: number | null;
  amount_usdc_cents?: number | null;
  paid_currency?: string | null;
  status?: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | string | null;
  items?: CheckoutItem[] | null;
  expires_at?: number | null;
  created_at?: number | null;
}

export interface CreateCheckoutReq {
  external_reference?: string;
  amount_ves_cents?: number;
  amount_usdc_cents?: number;
  items: CheckoutItem[];
  expiration_minutes?: number;
}

export interface ListCheckoutsParams {
  limit?: number;
  cursor_created_at?: number;
  cursor_id?: string;
}

export interface PapayaClientOptions {
  apiKey: string;
  baseUrl?: string;
}
