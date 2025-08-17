import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../lib/hooks';
import { loginBank, clearError } from '../../../lib/slices/authSlice';
import { clearErrors } from '../../../lib/slices/bankSlice';
import { selectIsAuthenticated, selectAuthLoading, selectAuthError } from '../../../lib/selectors';
import { type BankLogin } from '../../../lib/api';
import { tokenManager } from '../../../lib/tokenManager';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Alert, AlertDescription } from '../../ui/alert';
import { AlertCircle, LogIn, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export function BankLoginForm() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const loading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);
  
  const [showAuthToken, setShowAuthToken] = useState(false);
  const [formData, setFormData] = useState<BankLogin>({
    email: '',
    bankCode: '',
    authToken: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-redirect to dashboard on successful login
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const updateField = (field: keyof BankLogin, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Admin email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.bankCode) {
      newErrors.bankCode = 'Bank code is required';
    } else if (!/^[A-Z0-9]{6}$/.test(formData.bankCode)) {
      newErrors.bankCode = 'Bank code must be 6 characters (A-Z, 0-9)';
    }

    if (!formData.authToken) {
      newErrors.authToken = 'API key/Auth token is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    dispatch(clearError());
    dispatch(clearErrors());

    try {
      const result = await dispatch(loginBank(formData)).unwrap();
      
      // Store tokens securely using token manager
      tokenManager.setTokens(
        result.token,
        result.token, // Using same token as refresh for now
        '24h'
      );

      // Show success message
      toast.success('Login successful!', {
        description: `Welcome back, ${result.user.adminFirstName}!`
      });

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed. Please check your credentials.';
      
      // Handle different error types safely
      if (typeof error === 'string') {
        if (error.includes('Account temporarily locked')) {
          errorMessage = 'Account temporarily locked due to multiple failed attempts. Please try again later.';
        } else if (error.includes('API key has expired')) {
          errorMessage = 'API key has expired. Please contact support for a new key.';
        } else {
          errorMessage = error;
        }
      } else if (error?.message && typeof error.message === 'string') {
        if (error.message.includes('Account temporarily locked')) {
          errorMessage = 'Account temporarily locked due to multiple failed attempts. Please try again later.';
        } else if (error.message.includes('API key has expired')) {
          errorMessage = 'API key has expired. Please contact support for a new key.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error('Login failed', {
        description: errorMessage
      });
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-3xl font-bold mb-2">Bank Login</h1>
        <p className="text-gray-600">
          Access your Rails banking dashboard
        </p>
      </motion.div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogIn className="w-5 h-5" />
            Sign In
          </CardTitle>
          <CardDescription>
            Enter your bank credentials to access the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Admin Email *
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="admin@yourbank.co.za"
                className={errors.email ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="bankCode" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Bank Code *
              </label>
              <Input
                id="bankCode"
                value={formData.bankCode}
                onChange={(e) => updateField('bankCode', e.target.value.toUpperCase())}
                placeholder="FNB001"
                maxLength={6}
                className={errors.bankCode ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.bankCode && (
                <p className="text-sm text-red-500">{errors.bankCode}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="authToken" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                API Key / Auth Token *
              </label>
              <div className="relative">
                <Input
                  id="authToken"
                  type={showAuthToken ? 'text' : 'password'}
                  value={formData.authToken}
                  onChange={(e) => updateField('authToken', e.target.value)}
                  placeholder="Your API key from registration"
                  className={errors.authToken ? 'border-red-500' : ''}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-gray-100 rounded-r-md disabled:opacity-50"
                  onClick={() => setShowAuthToken(!showAuthToken)}
                  disabled={loading}
                >
                  {showAuthToken ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.authToken && (
                <p className="text-sm text-red-500">{errors.authToken}</p>
              )}
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 !text-red-500" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <button 
              type="submit" 
              className="w-full h-9 px-4 py-2 bg-brand-950 text-white hover:bg-brand-900 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <button
                  type="button"
                  className="text-brand-950 underline-offset-4 hover:underline p-0 h-auto bg-transparent border-none cursor-pointer"
                  onClick={() => navigate('/register')}
                >
                  Register your bank
                </button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-700 mb-2">Need Help?</h4>
        <div className="space-y-1 text-sm text-gray-600">
          <p>• Use the admin email from your registration</p>
          <p>• Enter your 6-character bank code (e.g., FNB001)</p>
          <p>• Use the API key received after registration</p>
          <p>• Contact support if you've lost your credentials</p>
        </div>
      </div>
    </div>
  );
}