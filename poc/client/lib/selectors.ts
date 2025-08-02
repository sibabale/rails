import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './store';

// Base selectors
export const selectAuth = (state: RootState) => state.auth;
export const selectBank = (state: RootState) => state.bank;
export const selectTransactions = (state: RootState) => state.transactions;
export const selectHealth = (state: RootState) => state.health;
export const selectClients = (state: RootState) => state.clients;

// Auth selectors
export const selectIsAuthenticated = createSelector(
  [selectAuth],
  (auth) => auth.isAuthenticated
);

export const selectAuthToken = createSelector(
  [selectAuth],
  (auth) => auth.authToken
);

export const selectAuthUser = createSelector(
  [selectAuth],
  (auth) => auth.user
);

export const selectAuthLoading = createSelector(
  [selectAuth],
  (auth) => auth.loading
);

export const selectAuthError = createSelector(
  [selectAuth],
  (auth) => auth.error
);

// Bank selectors
export const selectBankProfile = createSelector(
  [selectBank],
  (bank) => bank.bankProfile
);

export const selectBankLoading = createSelector(
  [selectBank],
  (bank) => bank.profileLoading
);

export const selectBankRegistrationLoading = createSelector(
  [selectBank],
  (bank) => bank.registrationLoading
);

export const selectBankRegistrationSuccess = createSelector(
  [selectBank],
  (bank) => bank.registrationSuccess
);

export const selectBankRegistrationError = createSelector(
  [selectBank],
  (bank) => bank.registrationError
);

// Transaction selectors
export const selectAllTransactions = createSelector(
  [selectTransactions],
  (transactions) => transactions.transactions
);

export const selectTransactionsLoading = createSelector(
  [selectTransactions],
  (transactions) => transactions.loading
);

export const selectTransactionsError = createSelector(
  [selectTransactions],
  (transactions) => transactions.error
);

export const selectLastSubmission = createSelector(
  [selectTransactions],
  (transactions) => transactions.lastSubmission
);

// Filtered transactions selector
export const selectFilteredTransactions = createSelector(
  [selectAllTransactions, (state: RootState, filters: { search?: string; status?: string; bank?: string }) => filters],
  (transactions, filters) => {
    if (!filters) return transactions;
    
    return transactions.filter((transaction) => {
      const matchesSearch = !filters.search || 
        (transaction.txn_ref || '').toLowerCase().includes(filters.search.toLowerCase()) ||
        (transaction.description || '').toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesStatus = !filters.status || filters.status === 'all' || 
        transaction.status === filters.status;
      
      const matchesBank = !filters.bank || filters.bank === 'all' || 
        transaction.senderBank === filters.bank || transaction.receiverBank === filters.bank;
      
      return matchesSearch && matchesStatus && matchesBank;
    });
  }
);

// Client selectors
export const selectAllClients = createSelector(
  [selectClients],
  (clients) => clients.clients
);

export const selectClientsLoading = createSelector(
  [selectClients],
  (clients) => clients.loading
);

// Combined selectors
export const selectAuthenticatedBankProfile = createSelector(
  [selectIsAuthenticated, selectBankProfile],
  (isAuthenticated, bankProfile) => 
    isAuthenticated && bankProfile ? bankProfile : null
);

export const selectDashboardData = createSelector(
  [selectAuthenticatedBankProfile, selectAllTransactions, selectTransactionsLoading],
  (bankProfile, transactions, loading) => ({
    bankProfile,
    transactions: bankProfile ? transactions.filter(t => 
      t.senderBank === bankProfile.bankCode || t.receiverBank === bankProfile.bankCode
    ) : [],
    loading
  })
);

// Health selectors
export const selectHealthStatus = createSelector(
  [selectHealth],
  (health) => health.health
);

export const selectHealthLoading = createSelector(
  [selectHealth],
  (health) => health.loading
);

export const selectHealthError = createSelector(
  [selectHealth],
  (health) => health.error
);