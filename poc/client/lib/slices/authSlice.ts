import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { setAuthToken, clearAuthToken, loginBank as apiLoginBank, type BankLogin, type BankProfile } from '../api';
import { setBankProfile } from './bankSlice';

interface AuthState {
  isAuthenticated: boolean;
  authToken: string | null;
  user: BankProfile | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  authToken: null,
  user: null,
  loading: false,
  error: null,
};

// Async thunks
export const loginBank = createAsyncThunk(
  'auth/loginBank',
  async (loginData: BankLogin, { rejectWithValue, dispatch }) => {
    try {
      const result = await apiLoginBank(loginData);
      setAuthToken(result.accessToken);
      dispatch(setBankProfile(result.bank));
      return { token: result.accessToken, user: result.bank };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to login');
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ token: string; user: BankProfile }>) => {
      state.isAuthenticated = true;
      state.authToken = action.payload.token;
      state.user = action.payload.user;
      state.error = null;
      setAuthToken(action.payload.token);
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.authToken = null;
      state.user = null;
      state.error = null;
      clearAuthToken();
    },
    resetState: () => initialState,
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginBank.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginBank.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.authToken = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(loginBank.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { login, logout, resetState, clearError } = authSlice.actions;