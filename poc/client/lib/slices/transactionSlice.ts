import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { submitTransaction as apiSubmitTransaction, getTransactions, type Transaction, type TransactionRecord } from '../api';

interface TransactionState {
  transactions: TransactionRecord[];
  loading: boolean;
  error: string | null;
  submissionLoading: boolean;
  submissionError: string | null;
  lastSubmission: TransactionRecord | null;
}

const initialState: TransactionState = {
  transactions: [],
  loading: false,
  error: null,
  submissionLoading: false,
  submissionError: null,
  lastSubmission: null,
};

export const submitTransaction = createAsyncThunk(
  'transactions/submitTransaction',
  async (transaction: Transaction, { rejectWithValue, dispatch }) => {
    try {
      const result = await apiSubmitTransaction(transaction);
      
      // Refresh transactions if we have a userId
      if (transaction.userId) {
        dispatch(loadTransactions({ userId: transaction.userId }));
      }
      
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to submit transaction');
    }
  }
);

export const loadTransactions = createAsyncThunk(
  'transactions/loadTransactions',
  async ({ userId, limit = 10 }: { userId: string; limit?: number }, { rejectWithValue }) => {
    try {
      const result = await getTransactions({ userId, limit });
      return result.transactions;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load transactions');
    }
  }
);

export const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = null;
      state.submissionError = null;
    },
    resetState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Submit transaction
      .addCase(submitTransaction.pending, (state) => {
        state.submissionLoading = true;
        state.submissionError = null;
      })
      .addCase(submitTransaction.fulfilled, (state, action) => {
        state.submissionLoading = false;
        state.lastSubmission = action.payload;
        state.submissionError = null;
      })
      .addCase(submitTransaction.rejected, (state, action) => {
        state.submissionLoading = false;
        state.submissionError = action.payload as string;
      })
      // Load transactions
      .addCase(loadTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload;
        state.error = null;
      })
      .addCase(loadTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearErrors, resetState: resetTransactionState } = transactionSlice.actions;