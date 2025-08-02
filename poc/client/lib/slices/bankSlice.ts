import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { registerBank as apiRegisterBank, getBankProfile, type BankRegistration, type BankProfile } from '../api';

interface BankState {
  bankProfile: BankProfile | null;
  profileLoading: boolean;
  profileError: string | null;
  registrationLoading: boolean;
  registrationError: string | null;
  registrationSuccess: boolean;
}

const initialState: BankState = {
  bankProfile: null,
  profileLoading: false,
  profileError: null,
  registrationLoading: false,
  registrationError: null,
  registrationSuccess: false,
};

export const registerBank = createAsyncThunk(
  'bank/registerBank',
  async (bankData: BankRegistration, { rejectWithValue }) => {
    try {
      await apiRegisterBank(bankData);
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to register bank');
    }
  }
);

export const loadBankProfile = createAsyncThunk(
  'bank/loadBankProfile',
  async (_, { rejectWithValue }) => {
    try {
      const profile = await getBankProfile();
      return profile;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load bank profile');
    }
  }
);

export const bankSlice = createSlice({
  name: 'bank',
  initialState,
  reducers: {
    setBankProfile: (state, action) => {
      state.bankProfile = action.payload;
    },
    clearErrors: (state) => {
      state.profileError = null;
      state.registrationError = null;
    },
    resetRegistration: (state) => {
      state.registrationSuccess = false;
      state.registrationError = null;
    },
    resetState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Register bank
      .addCase(registerBank.pending, (state) => {
        state.registrationLoading = true;
        state.registrationError = null;
      })
      .addCase(registerBank.fulfilled, (state) => {
        state.registrationLoading = false;
        state.registrationSuccess = true;
        state.registrationError = null;
      })
      .addCase(registerBank.rejected, (state, action) => {
        state.registrationLoading = false;
        state.registrationError = action.payload as string;
      })
      // Load bank profile
      .addCase(loadBankProfile.pending, (state) => {
        state.profileLoading = true;
        state.profileError = null;
      })
      .addCase(loadBankProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.bankProfile = action.payload;
        state.profileError = null;
      })
      .addCase(loadBankProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.profileError = action.payload as string;
      });
  },
});

export const { setBankProfile, clearErrors, resetRegistration, resetState: resetBankState } = bankSlice.actions;