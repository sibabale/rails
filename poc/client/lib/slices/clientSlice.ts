import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getBankClients, registerClient as apiRegisterClient, type Client } from '../api';

interface ClientState {
  clients: Client[];
  loading: boolean;
  error: string | null;
  registrationLoading: boolean;
  registrationError: string | null;
}

const initialState: ClientState = {
  clients: [],
  loading: false,
  error: null,
  registrationLoading: false,
  registrationError: null,
};

export const loadClients = createAsyncThunk(
  'clients/loadClients',
  async (params: any = {}, { rejectWithValue }) => {
    try {
      const result = await getBankClients(params);
      return result.clients;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load clients');
    }
  }
);

export const registerClient = createAsyncThunk(
  'clients/registerClient',
  async (clientData: Client, { rejectWithValue, dispatch }) => {
    try {
      await apiRegisterClient(clientData);
      // Refresh clients list
      dispatch(loadClients({}));
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to register client');
    }
  }
);

export const clientSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = null;
      state.registrationError = null;
    },
    resetState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Load clients
      .addCase(loadClients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadClients.fulfilled, (state, action) => {
        state.loading = false;
        state.clients = action.payload;
        state.error = null;
      })
      .addCase(loadClients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Register client
      .addCase(registerClient.pending, (state) => {
        state.registrationLoading = true;
        state.registrationError = null;
      })
      .addCase(registerClient.fulfilled, (state) => {
        state.registrationLoading = false;
        state.registrationError = null;
      })
      .addCase(registerClient.rejected, (state, action) => {
        state.registrationLoading = false;
        state.registrationError = action.payload as string;
      });
  },
});

export const { clearErrors, resetState: resetClientState } = clientSlice.actions;