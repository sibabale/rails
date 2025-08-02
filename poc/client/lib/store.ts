import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { authSlice } from './slices/authSlice';
import { healthSlice } from './slices/healthSlice';
import { transactionSlice } from './slices/transactionSlice';
import { bankSlice } from './slices/bankSlice';
import { clientSlice } from './slices/clientSlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'bank'], // Only persist auth and bank state
};

const rootReducer = combineReducers({
  auth: authSlice.reducer,
  health: healthSlice.reducer,
  transactions: transactionSlice.reducer,
  bank: bankSlice.reducer,
  clients: clientSlice.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;