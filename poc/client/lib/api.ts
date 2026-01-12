// API client for Rails Financial API - Functional Approach

import { tokenManager } from './tokenManager';

export interface Transaction {
  txn_ref: string;
  userId: string;
  amount: number;
  type: 'debit' | 'credit';
  currency?: string;
  timestamp?: string;
  description: string;
  sender: string;
  receiver: string;
  senderBank: string;
  receiverBank: string;
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
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
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

// Configuration
const getBaseUrl = (): string => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
};

const getDefaultHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
});

// Auth token management
let authToken: string | null = null;

export const setAuthToken = (token: string): void => {
  authToken = token;
};

export const clearAuthToken = (): void => {
  authToken = null;
};

const getHeaders = async (customHeaders?: HeadersInit): Promise<HeadersInit> => {
  const defaultHeaders = getDefaultHeaders();
  const baseHeaders: Record<string, string> = {};

  // Convert default headers to Record
  if (typeof defaultHeaders === 'object' && !Array.isArray(defaultHeaders)) {
    Object.assign(baseHeaders, defaultHeaders);
  }

  // Get current access token from token manager
  const accessToken = await tokenManager.getAccessToken();
  if (accessToken) {
    baseHeaders['Authorization'] = `Bearer ${accessToken}`;
  }

  // Convert custom headers to proper format
  const finalHeaders: Record<string, string> = { ...baseHeaders };
  
  if (customHeaders) {
    if (customHeaders instanceof Headers) {
      customHeaders.forEach((value, key) => {
        finalHeaders[key] = value;
      });
    } else if (Array.isArray(customHeaders)) {
      customHeaders.forEach(([key, value]) => {
        if (typeof key === 'string' && typeof value === 'string') {
          finalHeaders[key] = value;
        }
      });
    } else if (typeof customHeaders === 'object') {
      Object.assign(finalHeaders, customHeaders);
    }
  }

  return finalHeaders;
};

// Core request function
const makeRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${getBaseUrl()}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: await getHeaders(options.headers),
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new ApiError(errorData.error || 'Request failed', {
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
      data: { error: 'Network error', message: (error as Error).message },
    });
  }
};

// API Functions

export const getHealth = (): Promise<HealthStatus> => {
  return makeRequest<HealthStatus>('/api/health');
};

export const submitTransaction = (transaction: Transaction): Promise<TransactionResponse> => {
  return makeRequest<TransactionResponse>('/api/webhook', {
    method: 'POST',
    body: JSON.stringify(transaction),
  });
};

export const getTransactions = (params: {
  userId: string;
  limit?: number;
  offset?: number;
}): Promise<{ transactions: TransactionRecord[]; pagination: any }> => {
  const searchParams = new URLSearchParams({
    userId: params.userId,
  });
  if (params.limit !== undefined) searchParams.set('pageSize', params.limit.toString());
  if (params.offset !== undefined) searchParams.set('page', Math.floor(params.offset / (params.limit || 5) + 1).toString());

  return makeRequest<{ transactions: TransactionRecord[]; pagination: any }>(
    `/api/transaction/transactions?${searchParams}`
  );
};

export const registerBank = (bankData: BankRegistration): Promise<any> => {
  console.log('registerBank called with:', bankData);
  return makeRequest<any>('/api/banks/register', {
    method: 'POST',
    body: JSON.stringify(bankData),
  });
};

export const loginBank = (loginData: BankLogin): Promise<any> => {
  return makeRequest<any>('/api/banks/login', {
    method: 'POST',
    body: JSON.stringify(loginData),
  });
};

export const getBankProfile = (): Promise<BankProfile> => {
  return makeRequest<BankProfile>('/api/banks/profile');
};

export const getBankClients = (params?: {
  status?: string;
  clientType?: string;
  sortBy?: string;
  limit?: number;
  offset?: number;
}): Promise<{ clients: Client[]; pagination: any }> => {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.clientType) searchParams.set('clientType', params.clientType);
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.offset) searchParams.set('offset', params.offset.toString());

  const query = searchParams.toString();
  return makeRequest<{ clients: Client[]; pagination: any }>(
    `/api/banks/clients${query ? `?${query}` : ''}`
  );
};

export const registerClient = (clientData: Client): Promise<Client> => {
  return makeRequest<Client>('/api/banks/clients', {
    method: 'POST',
    body: JSON.stringify(clientData),
  });
};

export const getAdminStatus = (adminToken: string): Promise<AdminStatus> => {
  return makeRequest<AdminStatus>('/api/admin/status', {
    headers: {
      'x-admin-token': adminToken,
    },
  });
};

export const triggerSettlement = (authorizedBy: string, force: boolean = false): Promise<{
  message: string;
  settled: any[];
  settlement_timestamp: string;
}> => {
  return makeRequest('/api/ledger/settle', {
    method: 'POST',
    body: JSON.stringify({ authorized_by: authorizedBy, force }),
  });
};

export const getPendingTransactions = (): Promise<{
  pending: any[];
  count: number;
  timestamp: string;
}> => {
  return makeRequest('/api/ledger/pending');
};

export const getDashboardMetrics = (): Promise<any> => {
  return makeRequest('/api/dashboard/metrics');
};

export const refreshAccessToken = (refreshToken: string): Promise<{
  success: boolean;
  accessToken?: string;
  expiresIn?: string;
  error?: string;
}> => {
  return makeRequest('/api/banks/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
};

export const logout = (): Promise<{ message: string }> => {
  return makeRequest('/api/banks/logout', {
    method: 'POST',
  });
};

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