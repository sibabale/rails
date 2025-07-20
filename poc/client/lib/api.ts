// API client for Rails Financial API

export interface Transaction {
  txn_ref: string;
  userId: string;
  amount: number;
  type: 'debit' | 'credit';
  currency?: string;
  timestamp?: string;
  description: string;
  source_account: string;
  destination_account?: string;
  metadata: {
    ip_address: string;
    session_id: string;
    user_agent?: string;
    device_fingerprint?: string;
  };
}

export interface TransactionResponse {
  message: string;
  txn_ref: string;
  status: string;
  timestamp: string;
}

export interface TransactionRecord extends Transaction {
  status: 'pending' | 'completed' | 'failed';
  received_at: string;
  processed_at?: string;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  version: string;
}

export interface BankRegistration {
  bankName: string;
  bankCode: string;
  contactEmail: string;
  contactPhone: string;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country?: string;
  };
  adminUser: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    idNumber: string;
    position: string;
  };
  businessDetails: {
    registrationNumber: string;
    vatNumber?: string;
    website?: string;
    establishedYear: number;
    bankType: 'commercial' | 'mutual' | 'cooperative' | 'investment';
    expectedVolume: 'low' | 'medium' | 'high' | 'enterprise';
  };
  compliance: {
    sarb_registered: boolean;
    sarb_license_number?: string;
    fica_compliant: boolean;
    popi_compliant: boolean;
    accepts_terms: boolean;
  };
}

export interface BankLogin {
  email: string;
  bankCode: string;
  authToken: string;
}

export interface BankProfile {
  id: string;
  bankCode: string;
  bankName: string;
  status: string;
  contactEmail: string;
  contactPhone: string;
  address: any;
  businessDetails: any;
  settings: any;
  metrics: any;
  createdAt: string;
  lastLogin: string | null;
}

export interface Client {
  clientId: string;
  clientName: string;
  clientType: 'individual' | 'business' | 'corporate';
  contactEmail: string;
  contactPhone: string;
  accountDetails: {
    accountNumber: string;
    accountType: 'savings' | 'current' | 'fixed_deposit' | 'investment';
    currency: string;
    initialBalance: number;
    dailyTransactionLimit: number;
    monthlyTransactionLimit: number;
  };
  kycDetails: {
    idNumber?: string;
    registrationNumber?: string;
    address: {
      street: string;
      city: string;
      province: string;
      postalCode: string;
      country: string;
    };
    riskProfile: 'low' | 'medium' | 'high';
    fica_status: 'pending' | 'verified' | 'rejected';
    popi_consent: boolean;
  };
}

export interface AdminStatus {
  system: {
    uptime: number;
    memory_usage: object;
    queue_size: number;
  };
  ledger: {
    total_transactions: number;
    reserve_balance: number;
  };
}

export interface ApiError {
  error: string;
  message: string;
  details?: Array<{
    field: string;
    message: string;
    value?: string;
  }>;
  timestamp: string;
  correlation_id?: string;
}

class RailsApiClient {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new ApiError(errorData.message || 'Request failed', {
          status: response.status,
          data: errorData,
        });
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError('Network error', {
        status: 0,
        data: { error: 'Network error', message: error.message },
      });
    }
  }

  // Health check
  async getHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>('/api/health');
  }

  // Submit transaction
  async submitTransaction(transaction: Transaction): Promise<TransactionResponse> {
    return this.request<TransactionResponse>('/api/webhook', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  // Get transactions
  async getTransactions(params: {
    userId: string;
    limit?: number;
    offset?: number;
  }): Promise<{ transactions: TransactionRecord[]; pagination: any }> {
    const searchParams = new URLSearchParams({
      userId: params.userId,
      ...(params.limit && { limit: params.limit.toString() }),
      ...(params.offset && { offset: params.offset.toString() }),
    });

    return this.request<{ transactions: TransactionRecord[]; pagination: any }>(
      `/api/transactions?${searchParams}`
    );
  }

  // Bank registration
  async registerBank(bankData: BankRegistration): Promise<any> {
    return this.request<any>('/api/banks/register', {
      method: 'POST',
      body: JSON.stringify(bankData),
    });
  }

  // Bank login
  async loginBank(loginData: BankLogin): Promise<any> {
    return this.request<any>('/api/banks/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    });
  }

  // Get bank profile
  async getBankProfile(): Promise<BankProfile> {
    return this.request<BankProfile>('/api/banks/profile');
  }

  // Get bank clients
  async getBankClients(params?: {
    status?: string;
    clientType?: string;
    sortBy?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ clients: Client[]; pagination: any }> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.clientType) searchParams.set('clientType', params.clientType);
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());

    const query = searchParams.toString();
    return this.request<{ clients: Client[]; pagination: any }>(
      `/api/banks/clients${query ? `?${query}` : ''}`
    );
  }

  // Register client for bank
  async registerClient(clientData: Client): Promise<Client> {
    return this.request<Client>('/api/banks/clients', {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
  }

  // Admin endpoints
  async getAdminStatus(adminToken: string): Promise<AdminStatus> {
    return this.request<AdminStatus>('/api/admin/status', {
      headers: {
        'x-admin-token': adminToken,
      },
    });
  }

  // Set JWT token for authenticated requests
  setAuthToken(token: string) {
    this.headers = {
      ...this.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  // Remove auth token
  clearAuthToken() {
    const { Authorization, ...remainingHeaders } = this.headers as any;
    this.headers = remainingHeaders;
  }
}

// Custom error class
export class ApiError extends Error {
  public status: number;
  public data: any;

  constructor(message: string, { status, data }: { status: number; data: any }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Export singleton instance
export const apiClient = new RailsApiClient();

// Utility functions
export const generateSessionId = (): string => {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const generateTransactionRef = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `TXN_${timestamp}_${random}`;
};

export const getClientIP = async (): Promise<string> => {
  try {
    // For development, return localhost
    if (import.meta.env.VITE_APP_ENV === 'development') {
      return '127.0.0.1';
    }
    
    // In production, you might want to use a service to get the real IP
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return '127.0.0.1'; // Fallback
  }
};