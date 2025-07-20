import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../lib/context';
import { type BankLogin } from '../lib/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, LogIn, Eye, EyeOff } from 'lucide-react';

export function BankLoginForm() {
  const { state, loginBank, clearErrors } = useApp();
  const [showAuthToken, setShowAuthToken] = useState(false);
  const [formData, setFormData] = useState<BankLogin>({
    email: '',
    bankCode: '',
    authToken: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (validateForm()) {
      clearErrors();
      await loginBank(formData);
    }
  };

  // If authenticated, show success message or redirect
  if (state.isAuthenticated && state.user) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto"
      >
        <Card>
          <CardHeader className="text-center">
            <LogIn className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Welcome Back!</CardTitle>
            <CardDescription>
              Successfully logged in as {state.user.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Bank Details</h4>
              <div className="space-y-1 text-sm text-green-700">
                <p><strong>Bank Code:</strong> {state.user.code}</p>
                <p><strong>Status:</strong> {state.user.status}</p>
                <p><strong>Admin:</strong> {state.user.adminUser?.firstName} {state.user.adminUser?.lastName}</p>
              </div>
            </div>
            <div className="flex justify-center">
              <Button 
                onClick={() => window.location.href = '/dashboard'}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-3xl font-bold mb-2">Bank Login</h1>
        <p className="text-muted-foreground">
          Access your Rails banking dashboard
        </p>
      </motion.div>

      <Card>
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
              <Label htmlFor="email">Admin Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="admin@yourbank.co.za"
                className={errors.email ? 'border-red-500' : ''}
                disabled={state.submissionLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankCode">Bank Code *</Label>
              <Input
                id="bankCode"
                value={formData.bankCode}
                onChange={(e) => updateField('bankCode', e.target.value.toUpperCase())}
                placeholder="FNB001"
                maxLength={6}
                className={errors.bankCode ? 'border-red-500' : ''}
                disabled={state.submissionLoading}
              />
              {errors.bankCode && (
                <p className="text-sm text-red-500">{errors.bankCode}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="authToken">API Key / Auth Token *</Label>
              <div className="relative">
                <Input
                  id="authToken"
                  type={showAuthToken ? 'text' : 'password'}
                  value={formData.authToken}
                  onChange={(e) => updateField('authToken', e.target.value)}
                  placeholder="Your API key from registration"
                  className={errors.authToken ? 'border-red-500' : ''}
                  disabled={state.submissionLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowAuthToken(!showAuthToken)}
                  disabled={state.submissionLoading}
                >
                  {showAuthToken ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.authToken && (
                <p className="text-sm text-red-500">{errors.authToken}</p>
              )}
            </div>

            {state.submissionError && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {state.submissionError}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full"
              disabled={state.submissionLoading}
            >
              {state.submissionLoading ? 'Signing In...' : 'Sign In'}
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() => window.location.href = '/register'}
                >
                  Register your bank
                </Button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">Need Help?</h4>
        <div className="space-y-1 text-sm text-blue-700">
          <p>• Use the admin email from your registration</p>
          <p>• Enter your 6-character bank code (e.g., FNB001)</p>
          <p>• Use the API key received after registration</p>
          <p>• Contact support if you've lost your credentials</p>
        </div>
      </div>
    </div>
  );
}