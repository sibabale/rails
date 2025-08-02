import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getHealth, type HealthStatus } from '../api';

interface HealthState {
  health: HealthStatus | null;
  loading: boolean;
  error: string | null;
}

const initialState: HealthState = {
  health: null,
  loading: false,
  error: null,
};

export const checkHealth = createAsyncThunk(
  'health/checkHealth',
  async (_, { rejectWithValue }) => {
    try {
      const health = await getHealth();
      return health;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check health');
    }
  }
);

export const healthSlice = createSlice({
  name: 'health',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkHealth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkHealth.fulfilled, (state, action) => {
        state.loading = false;
        state.health = action.payload;
        state.error = null;
      })
      .addCase(checkHealth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, resetState: resetHealthState } = healthSlice.actions;