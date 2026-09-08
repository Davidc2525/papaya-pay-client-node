import {
  Checkout,
  CreateCheckoutReq,
  ListCheckoutsParams,
  PapayaClientOptions,
} from './types';

export class PapayaAPIError extends Error {
  public status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'PapayaAPIError';
    this.status = status;
  }
}

export class CheckoutsService {
  constructor(private client: PapayaClient) {}

  /**
   * Normaliza un checkout en caso de que la API devuelva items como string
   */
  private normalizeCheckout(checkout: Checkout): Checkout {
    if (checkout.items && typeof checkout.items === 'string') {
      try {
        checkout.items = JSON.parse(checkout.items);
      } catch (e) {
        // Fallback silently
      }
    } else if (!checkout.items) {
      checkout.items = []; // Normalizar a un arreglo vacío si viene nulo
    }
    return checkout;
  }

  /**
   * Crea una nueva intención de pago (Checkout).
   */
  async create(payload: CreateCheckoutReq): Promise<Checkout> {
    const res = await this.client.request<Checkout>('POST', '/v1/gateway/api/checkouts', payload);
    return this.normalizeCheckout(res);
  }

  /**
   * Obtiene la lista de checkouts del comercio.
   */
  async list(params?: ListCheckoutsParams): Promise<Checkout[]> {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.cursor_created_at) query.append('cursor_created_at', params.cursor_created_at.toString());
    if (params?.cursor_id) query.append('cursor_id', params.cursor_id);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const checkouts = await this.client.request<Checkout[]>('GET', `/v1/gateway/api/checkouts${qs}`);
    return checkouts.map(c => this.normalizeCheckout(c));
  }

  /**
   * Consulta los detalles de un checkout por su ID.
   */
  async get(id: string): Promise<Checkout> {
    const res = await this.client.request<Checkout>('GET', `/v1/gateway/api/checkouts/${id}`);
    return this.normalizeCheckout(res);
  }

  /**
   * Cancela un checkout pendiente.
   */
  async cancel(id: string): Promise<void> {
    await this.client.request<void>('POST', `/v1/gateway/api/checkouts/${id}/cancel`);
  }
}

export class PapayaClient {
  public checkouts: CheckoutsService;
  private apiKey: string;
  private baseUrl: string;

  constructor(options: PapayaClientOptions) {
    if (!options.apiKey) {
      throw new Error('PapayaClient requiere una apiKey');
    }
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl || 'http://localhost:80').replace(/\/$/, '');
    
    this.checkouts = new CheckoutsService(this);
  }

  /**
   * Método interno para realizar peticiones HTTP a la API.
   * Utiliza la API fetch nativa de Node.js (v18+).
   */
  async request<T>(method: string, path: string, body?: any): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json',
    };

    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = errorText;
      try {
        const errJson = JSON.parse(errorText);
        errorMessage = errJson.message || errJson.error || errorText;
      } catch (e) {
        // Ignorar si no es JSON
      }
      throw new PapayaAPIError(
        `Error API Papaya (${response.status}): ${errorMessage}`,
        response.status
      );
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return (await response.json()) as T;
    }

    return (await response.text()) as unknown as T;
  }
}
