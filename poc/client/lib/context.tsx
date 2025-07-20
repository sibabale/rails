import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { apiClient, type Transaction, type TransactionRecord, type HealthStatus, type BankRegistration, type BankLogin, type BankProfile, type Client, ApiError } from './api';

// Types
interface AppState {
  // Health
  health: HealthStatus | null;
  healthLoading: boolean;
  healthError: string | null;

  // Transactions
  transactions: TransactionRecord[];
  transactionsLoading: boolean;
  transactionsError: string | null;

  // Current transaction being submitted
  submissionLoading: boolean;
  submissionError: string | null;
  lastSubmission: any | null;

  // Auth
  isAuthenticated: boolean;
  authToken: string | null;
  user: any | null;

  // Bank Management
  bankProfile: BankProfile | null;
  bankProfileLoading: boolean;
  bankProfileError: string | null;

  // Bank Registration
  registrationLoading: boolean;
  registrationError: string | null;
  registrationSuccess: boolean;

  // Clients
  clients: Client[];
  clientsLoading: boolean;
  clientsError: string | null;
}

type AppAction =
  | { type: 'SET_HEALTH_LOADING'; payload: boolean }
  | { type: 'SET_HEALTH_SUCCESS'; payload: HealthStatus }
  | { type: 'SET_HEALTH_ERROR'; payload: string }
  | { type: 'SET_TRANSACTIONS_LOADING'; payload: boolean }
  | { type: 'SET_TRANSACTIONS_SUCCESS'; payload: TransactionRecord[] }
  | { type: 'SET_TRANSACTIONS_ERROR'; payload: string }
  | { type: 'SET_SUBMISSION_LOADING'; payload: boolean }
  | { type: 'SET_SUBMISSION_SUCCESS'; payload: any }
  | { type: 'SET_SUBMISSION_ERROR'; payload: string }
  | { type: 'SET_AUTH'; payload: { token: string; user: any } }
  | { type: 'CLEAR_AUTH' }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_BANK_PROFILE_LOADING'; payload: boolean }
  | { type: 'SET_BANK_PROFILE_SUCCESS'; payload: BankProfile }
  | { type: 'SET_BANK_PROFILE_ERROR'; payload: string }
  | { type: 'SET_REGISTRATION_LOADING'; payload: boolean }
  | { type: 'SET_REGISTRATION_SUCCESS'; payload: boolean }
  | { type: 'SET_REGISTRATION_ERROR'; payload: string }
  | { type: 'SET_CLIENTS_LOADING'; payload: boolean }
  | { type: 'SET_CLIENTS_SUCCESS'; payload: Client[] }
  | { type: 'SET_CLIENTS_ERROR'; payload: string };

const initialState: AppState = {
  health: null,
  healthLoading: false,
  healthError: null,
  transactions: [],
  transactionsLoading: false,
  transactionsError: null,
  submissionLoading: false,
  submissionError: null,
  lastSubmission: null,
  isAuthenticated: false,
  authToken: null,
  user: null,
  bankProfile: null,
  bankProfileLoading: false,
  bankProfileError: null,
  registrationLoading: false,
  registrationError: null,
  registrationSuccess: false,
  clients: [],
  clientsLoading: false,
  clientsError: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_HEALTH_LOADING':
      return { ...state, healthLoading: action.payload, healthError: null };
    case 'SET_HEALTH_SUCCESS':
      return { ...state, health: action.payload, healthLoading: false, healthError: null };
    case 'SET_HEALTH_ERROR':
      return { ...state, healthError: action.payload, healthLoading: false };

    case 'SET_TRANSACTIONS_LOADING':
      return { ...state, transactionsLoading: action.payload, transactionsError: null };
    case 'SET_TRANSACTIONS_SUCCESS':
      return { ...state, transactions: action.payload, transactionsLoading: false, transactionsError: null };
    case 'SET_TRANSACTIONS_ERROR':
      return { ...state, transactionsError: action.payload, transactionsLoading: false };

    case 'SET_SUBMISSION_LOADING':
      return { ...state, submissionLoading: action.payload, submissionError: null };
    case 'SET_SUBMISSION_SUCCESS':
      return { ...state, lastSubmission: action.payload, submissionLoading: false, submissionError: null };
    case 'SET_SUBMISSION_ERROR':
      return { ...state, submissionError: action.payload, submissionLoading: false };

    case 'SET_AUTH':
      return { 
        ...state, 
        isAuthenticated: true, 
        authToken: action.payload.token, 
        user: action.payload.user 
      };
    case 'CLEAR_AUTH':
      return { 
        ...state, 
        isAuthenticated: false, 
        authToken: null, 
        user: null 
      };

    case 'SET_BANK_PROFILE_LOADING':
      return { ...state, bankProfileLoading: action.payload, bankProfileError: null };
    case 'SET_BANK_PROFILE_SUCCESS':
      return { ...state, bankProfile: action.payload, bankProfileLoading: false, bankProfileError: null };
    case 'SET_BANK_PROFILE_ERROR':
      return { ...state, bankProfileError: action.payload, bankProfileLoading: false };

    case 'SET_REGISTRATION_LOADING':
      return { ...state, registrationLoading: action.payload, registrationError: null };
    case 'SET_REGISTRATION_SUCCESS':
      return { ...state, registrationSuccess: action.payload, registrationLoading: false, registrationError: null };
    case 'SET_REGISTRATION_ERROR':
      return { ...state, registrationError: action.payload, registrationLoading: false };

    case 'SET_CLIENTS_LOADING':
      return { ...state, clientsLoading: action.payload, clientsError: null };
    case 'SET_CLIENTS_SUCCESS':
      return { ...state, clients: action.payload, clientsLoading: false, clientsError: null };
    case 'SET_CLIENTS_ERROR':
      return { ...state, clientsError: action.payload, clientsLoading: false };

    case 'CLEAR_ERRORS':
      return { 
        ...state, 
        healthError: null, 
        transactionsError: null, 
        submissionError: null,
        bankProfileError: null,
        registrationError: null,
        clientsError: null
      };

    default:
      return state;
  }
}

// Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  
  // Actions
  checkHealth: () => Promise<void>;
  submitTransaction: (transaction: Transaction) => Promise<void>;
  loadTransactions: (userId: string, limit?: number) => Promise<void>;
  login: (token: string, user: any) => void;
  logout: () => void;
  clearErrors: () => void;
  
  // Bank Actions
  registerBank: (bankData: BankRegistration) => Promise<void>;
  loginBank: (loginData: BankLogin) => Promise<void>;
  loadBankProfile: () => Promise<void>;
  loadClients: (params?: any) => Promise<void>;
  registerClient: (clientData: Client) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider
interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Actions
  const checkHealth = async () => {
    dispatch({ type: 'SET_HEALTH_LOADING', payload: true });
    try {
      const health = await apiClient.getHealth();
      dispatch({ type: 'SET_HEALTH_SUCCESS', payload: health });
    } catch (error) {
      const message = error instanceof ApiError 
        ? error.message 
        : 'Failed to check health';
      dispatch({ type: 'SET_HEALTH_ERROR', payload: message });
    }
  };

  const submitTransaction = async (transaction: Transaction) => {
    dispatch({ type: 'SET_SUBMISSION_LOADING', payload: true });
    try {
      const result = await apiClient.submitTransaction(transaction);
      dispatch({ type: 'SET_SUBMISSION_SUCCESS', payload: result });
      
      // Refresh transactions if we have a userId
      if (transaction.userId) {
        await loadTransactions(transaction.userId);
      }
    } catch (error) {
      const message = error instanceof ApiError 
        ? error.message 
        : 'Failed to submit transaction';
      dispatch({ type: 'SET_SUBMISSION_ERROR', payload: message });
    }
  };

  const loadTransactions = async (userId: string, limit = 10) => {
    dispatch({ type: 'SET_TRANSACTIONS_LOADING', payload: true });
    try {
      const result = await apiClient.getTransactions({ userId, limit });
      dispatch({ type: 'SET_TRANSACTIONS_SUCCESS', payload: result.transactions });
    } catch (error) {
      const message = error instanceof ApiError 
        ? error.message 
        : 'Failed to load transactions';
      dispatch({ type: 'SET_TRANSACTIONS_ERROR', payload: message });
    }
  };

  const login = (token: string, user: any) => {
    apiClient.setAuthToken(token);
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    dispatch({ type: 'SET_AUTH', payload: { token, user } });
  };

  const logout = () => {
    apiClient.clearAuthToken();
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    dispatch({ type: 'CLEAR_AUTH' });
  };

  const clearErrors = () => {
    dispatch({ type: 'CLEAR_ERRORS' });
  };

  // Bank Actions
  const registerBank = async (bankData: BankRegistration) => {
    dispatch({ type: 'SET_REGISTRATION_LOADING', payload: true });
    try {
      await apiClient.registerBank(bankData);
      dispatch({ type: 'SET_REGISTRATION_SUCCESS', payload: true });
    } catch (error) {
      const message = error instanceof ApiError 
        ? error.message 
        : 'Failed to register bank';
      dispatch({ type: 'SET_REGISTRATION_ERROR', payload: message });
    }
  };

  const loginBank = async (loginData: BankLogin) => {
    dispatch({ type: 'SET_SUBMISSION_LOADING', payload: true });
    try {
      const result = await apiClient.loginBank(loginData);
      apiClient.setAuthToken(result.token);
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('bank', JSON.stringify(result.bank));
      dispatch({ type: 'SET_AUTH', payload: { token: result.token, user: result.bank } });
      
      // Load bank profile after login
      await loadBankProfile();
    } catch (error) {
      const message = error instanceof ApiError 
        ? error.message 
        : 'Failed to login';
      dispatch({ type: 'SET_SUBMISSION_ERROR', payload: message });
    }
  };

  const loadBankProfile = async () => {
    dispatch({ type: 'SET_BANK_PROFILE_LOADING', payload: true });
    try {
      const profile = await apiClient.getBankProfile();
      dispatch({ type: 'SET_BANK_PROFILE_SUCCESS', payload: profile });
    } catch (error) {
      const message = error instanceof ApiError 
        ? error.message 
        : 'Failed to load bank profile';
      dispatch({ type: 'SET_BANK_PROFILE_ERROR', payload: message });
    }
  };

  const loadClients = async (params?: any) => {
    dispatch({ type: 'SET_CLIENTS_LOADING', payload: true });
    try {
      const result = await apiClient.getBankClients(params);
      dispatch({ type: 'SET_CLIENTS_SUCCESS', payload: result.clients });
    } catch (error) {
      const message = error instanceof ApiError 
        ? error.message 
        : 'Failed to load clients';
      dispatch({ type: 'SET_CLIENTS_ERROR', payload: message });
    }
  };

  const registerClient = async (clientData: Client) => {
    dispatch({ type: 'SET_SUBMISSION_LOADING', payload: true });
    try {
      await apiClient.registerClient(clientData);
      // Refresh clients list
      await loadClients();
      dispatch({ type: 'SET_SUBMISSION_SUCCESS', payload: true });
    } catch (error) {
      const message = error instanceof ApiError 
        ? error.message 
        : 'Failed to register client';
      dispatch({ type: 'SET_SUBMISSION_ERROR', payload: message });
    }
  };

  // Initialize auth from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        apiClient.setAuthToken(token);
        dispatch({ type: 'SET_AUTH', payload: { token, user } });
      } catch {
        // Invalid stored data, clear it
        logout();
      }
    }
  }, []);

  // Check health on mount
  useEffect(() => {
    checkHealth();
  }, []);

  const contextValue: AppContextType = {
    state,
    dispatch,
    checkHealth,
    submitTransaction,
    loadTransactions,
    login,
    logout,
    clearErrors,
    registerBank,
    loginBank,
    loadBankProfile,
    loadClients,
    registerClient,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

// Hook
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}