import { logout, resetState } from './slices/authSlice';
import { resetBankState } from './slices/bankSlice';
import { resetTransactionState } from './slices/transactionSlice';
import { resetClientState } from './slices/clientSlice';
import { resetHealthState } from './slices/healthSlice';
import type { AppDispatch } from './store';

// Comprehensive logout action that clears all state
export const logoutAndClearState = () => (dispatch: AppDispatch) => {
  // Clear auth state and localStorage
  dispatch(logout());
  
  // Reset all slice states to initial values
  dispatch(resetState());
  dispatch(resetBankState());
  dispatch(resetTransactionState());
  dispatch(resetClientState());
  dispatch(resetHealthState());
  
  // Clear any remaining localStorage items
  localStorage.removeItem('user');
  localStorage.removeItem('bank');
};