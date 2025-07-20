import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../lib/context';
import { type BankRegistration } from '../lib/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, AlertCircle, Building2, User, MapPin, FileText, Shield } from 'lucide-react';

const SA_PROVINCES = [
  'Eastern Cape',
  'Free State', 
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape'
];

const BANK_TYPES = [
  { value: 'commercial', label: 'Commercial Bank' },
  { value: 'mutual', label: 'Mutual Bank' },
  { value: 'cooperative', label: 'Cooperative Bank' },
  { value: 'investment', label: 'Investment Bank' }
];

const EXPECTED_VOLUMES = [
  { value: 'low', label: 'Low (< R1M/month)' },
  { value: 'medium', label: 'Medium (R1M - R10M/month)' },
  { value: 'high', label: 'High (R10M - R100M/month)' },
  { value: 'enterprise', label: 'Enterprise (> R100M/month)' }
];

interface FormStepProps {
  children: React.ReactNode;
  title: string;
  description: string;
  icon: React.ReactNode;
  isActive: boolean;
}

function FormStep({ children, title, description, icon, isActive }: FormStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: isActive ? 1 : 0.7, x: 0 }}
      className={`space-y-6 ${!isActive ? 'hidden' : ''}`}
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 rounded-lg" style={{ backgroundColor: '#f0f0f3' }}>
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm" style={{ color: '#717182' }}>{description}</p>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

export function BankRegistrationForm() {
  const { state, registerBank, clearErrors } = useApp();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<BankRegistration>>({
    bankName: '',
    bankCode: '',
    contactEmail: '',
    contactPhone: '',
    address: {
      street: '',
      city: '',
      province: '',
      postalCode: '',
      country: 'South Africa'
    },
    adminUser: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      idNumber: '',
      position: ''
    },
    businessDetails: {
      registrationNumber: '',
      vatNumber: '',
      website: '',
      establishedYear: new Date().getFullYear(),
      bankType: 'commercial',
      expectedVolume: 'medium'
    },
    compliance: {
      sarb_registered: false,
      sarb_license_number: '',
      fica_compliant: false,
      popi_compliant: false,
      accepts_terms: false
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateFormData = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof BankRegistration],
        [field]: value
      }
    }));
    // Clear field error when user starts typing
    if (errors[`${section}.${field}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${section}.${field}`];
        return newErrors;
      });
    }
  };

  const updateBasicField = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Basic Information
        if (!formData.bankName) newErrors.bankName = 'Bank name is required';
        if (!formData.bankCode) newErrors.bankCode = 'Bank code is required';
        if (formData.bankCode && !/^[A-Z0-9]{6}$/.test(formData.bankCode)) {
          newErrors.bankCode = 'Bank code must be 6 characters (A-Z, 0-9)';
        }
        if (!formData.contactEmail) newErrors.contactEmail = 'Contact email is required';
        if (!formData.contactPhone) newErrors.contactPhone = 'Contact phone is required';
        if (formData.contactPhone && !/^\+27[0-9]{9}$/.test(formData.contactPhone)) {
          newErrors.contactPhone = 'Phone must be in format +27XXXXXXXXX';
        }
        break;

      case 2: // Address & Admin
        if (!formData.address?.street) newErrors['address.street'] = 'Street address is required';
        if (!formData.address?.city) newErrors['address.city'] = 'City is required';
        if (!formData.address?.province) newErrors['address.province'] = 'Province is required';
        if (!formData.address?.postalCode) newErrors['address.postalCode'] = 'Postal code is required';
        
        if (!formData.adminUser?.firstName) newErrors['adminUser.firstName'] = 'First name is required';
        if (!formData.adminUser?.lastName) newErrors['adminUser.lastName'] = 'Last name is required';
        if (!formData.adminUser?.email) newErrors['adminUser.email'] = 'Admin email is required';
        if (!formData.adminUser?.phone) newErrors['adminUser.phone'] = 'Admin phone is required';
        if (!formData.adminUser?.idNumber) newErrors['adminUser.idNumber'] = 'ID number is required';
        if (formData.adminUser?.idNumber && !/^[0-9]{13}$/.test(formData.adminUser.idNumber)) {
          newErrors['adminUser.idNumber'] = 'ID number must be 13 digits';
        }
        if (!formData.adminUser?.position) newErrors['adminUser.position'] = 'Position is required';
        break;

      case 3: // Business Details
        if (!formData.businessDetails?.registrationNumber) {
          newErrors['businessDetails.registrationNumber'] = 'Registration number is required';
        }
        if (!formData.businessDetails?.bankType) {
          newErrors['businessDetails.bankType'] = 'Bank type is required';
        }
        if (!formData.businessDetails?.expectedVolume) {
          newErrors['businessDetails.expectedVolume'] = 'Expected volume is required';
        }
        break;

      case 4: // Compliance
        if (!formData.compliance?.fica_compliant) {
          newErrors['compliance.fica_compliant'] = 'FICA compliance is required';
        }
        if (!formData.compliance?.popi_compliant) {
          newErrors['compliance.popi_compliant'] = 'POPI compliance is required';
        }
        if (!formData.compliance?.accepts_terms) {
          newErrors['compliance.accepts_terms'] = 'You must accept the terms and conditions';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(4)) {
      clearErrors();
      await registerBank(formData as BankRegistration);
    }
  };

  if (state.registrationSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto"
      >
        <Card style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Registration Successful!</CardTitle>
            <CardDescription>
              Your bank registration has been submitted successfully. 
              You will receive further instructions via email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert 
              style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                padding: '1rem',
                borderRadius: '0.375rem'
              }}
            >
              <AlertCircle className="h-4 w-4" style={{ color: '#0284c7' }} />
              <AlertDescription style={{ color: '#0284c7' }}>
                <strong>Next Steps:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Check your email for API credentials</li>
                  <li>• Complete compliance verification</li>
                  <li>• Contact Rails support for account activation</li>
                </ul>
              </AlertDescription>
            </Alert>
            <div className="flex justify-center">
              <Button 
                onClick={() => window.location.reload()}
                className="w-full"
                style={{
                  backgroundColor: '#030213',
                  color: '#ffffff',
                  border: '1px solid #030213',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#02020f';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#030213';
                }}
              >
                Register Another Bank
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-center mb-2">Bank Registration</h1>
        <p className="text-center" style={{ color: '#717182' }}>
          Join the Rails financial infrastructure platform
        </p>
      </motion.div>

      {/* Progress Steps */}
      <div className="flex justify-between mb-8">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`flex items-center ${
              step < 4 ? 'flex-1' : ''
            }`}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
              style={{
                backgroundColor: step <= currentStep ? '#030213' : '#ececf0',
                color: step <= currentStep ? '#ffffff' : '#717182'
              }}
            >
              {step}
            </div>
            {step < 4 && (
              <div
                className="flex-1 h-1 mx-2"
                style={{
                  backgroundColor: step < currentStep ? '#030213' : '#ececf0'
                }}
              />
            )}
          </div>
        ))}
      </div>

      <Card style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Information */}
            <FormStep
              title="Basic Information"
              description="Tell us about your bank"
              icon={<Building2 className="w-5 h-5" style={{ color: '#030213' }} />}
              isActive={currentStep === 1}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input
                    id="bankName"
                    name="bankName"
                    value={formData.bankName}
                    onChange={(e) => updateBasicField('bankName', e.target.value)}
                    placeholder="e.g., First National Bank"
                    style={{
                      border: errors.bankName ? '1px solid #ef4444' : '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem'
                    }}
                  />
                  {errors.bankName && (
                    <p className="text-sm text-red-500 mt-1">{errors.bankName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankCode">Bank Code (6 chars) *</Label>
                  <Input
                    id="bankCode"
                    name="bankCode"
                    value={formData.bankCode}
                    onChange={(e) => updateBasicField('bankCode', e.target.value.toUpperCase())}
                    placeholder="e.g., FNB001"
                    maxLength={6}
                    style={{
                      border: errors.bankCode ? '1px solid #ef4444' : '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem'
                    }}
                  />
                  {errors.bankCode && (
                    <p className="text-sm text-red-500 mt-1">{errors.bankCode}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email *</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => updateBasicField('contactEmail', e.target.value)}
                    placeholder="info@yourbank.co.za"
                    style={{
                      border: errors.contactEmail ? '1px solid #ef4444' : '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem'
                    }}
                  />
                  {errors.contactEmail && (
                    <p className="text-sm text-red-500 mt-1">{errors.contactEmail}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone *</Label>
                  <Input
                    id="contactPhone"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => updateBasicField('contactPhone', e.target.value)}
                    placeholder="+27101234567"
                    style={{
                      border: errors.contactPhone ? '1px solid #ef4444' : '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem'
                    }}
                  />
                  {errors.contactPhone && (
                    <p className="text-sm text-red-500 mt-1">{errors.contactPhone}</p>
                  )}
                </div>
              </div>
            </FormStep>

            {/* Step 2: Address & Admin User */}
            <FormStep
              title="Address & Admin User"
              description="Bank location and admin contact"
              icon={<MapPin className="w-5 h-5" style={{ color: '#030213' }} />}
              isActive={currentStep === 2}
            >
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-4">Bank Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="street">Street Address *</Label>
                      <Input
                        id="street"
                        name="street"
                        value={formData.address?.street}
                        onChange={(e) => updateFormData('address', 'street', e.target.value)}
                        placeholder="123 Main Street, Suite 100"
                        style={{
                          border: errors['address.street'] ? '1px solid #ef4444' : '1px solid #e2e8f0',
                          backgroundColor: '#ffffff',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.375rem'
                        }}
                      />
                      {errors['address.street'] && (
                        <p className="text-sm text-red-500 mt-1">{errors['address.street']}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.address?.city}
                        onChange={(e) => updateFormData('address', 'city', e.target.value)}
                        placeholder="Johannesburg"
                        style={{
                          border: errors['address.city'] ? '1px solid #ef4444' : '1px solid #e2e8f0',
                          backgroundColor: '#ffffff',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.375rem'
                        }}
                      />
                      {errors['address.city'] && (
                        <p className="text-sm text-red-500 mt-1">{errors['address.city']}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="province">Province *</Label>
                      <Select 
                        name="province"
                        value={formData.address?.province} 
                        onValueChange={(value) => updateFormData('address', 'province', value)}
                      >
                        <SelectTrigger 
                          style={{
                            border: errors['address.province'] ? '1px solid #ef4444' : '1px solid #e2e8f0',
                            backgroundColor: '#ffffff',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '0.375rem'
                          }}
                        >
                          <SelectValue placeholder="Select province" />
                        </SelectTrigger>
                        <SelectContent style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
                          {SA_PROVINCES.map((province) => (
                            <SelectItem key={province} value={province}>
                              {province}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors['address.province'] && (
                        <p className="text-sm text-red-500 mt-1">{errors['address.province']}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postal Code *</Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        value={formData.address?.postalCode}
                        onChange={(e) => updateFormData('address', 'postalCode', e.target.value)}
                        placeholder="2000"
                        maxLength={4}
                        style={{
                          border: errors['address.postalCode'] ? '1px solid #ef4444' : '1px solid #e2e8f0',
                          backgroundColor: '#ffffff',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.375rem'
                        }}
                      />
                      {errors['address.postalCode'] && (
                        <p className="text-sm text-red-500 mt-1">{errors['address.postalCode']}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">Admin User</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.adminUser?.firstName}
                        onChange={(e) => updateFormData('adminUser', 'firstName', e.target.value)}
                        placeholder="John"
                        style={{
                          border: errors['adminUser.firstName'] ? '1px solid #ef4444' : '1px solid #e2e8f0',
                          backgroundColor: '#ffffff',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.375rem'
                        }}
                      />
                      {errors['adminUser.firstName'] && (
                        <p className="text-sm text-red-500 mt-1">{errors['adminUser.firstName']}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.adminUser?.lastName}
                        onChange={(e) => updateFormData('adminUser', 'lastName', e.target.value)}
                        placeholder="Doe"
                        style={{
                          border: errors['adminUser.lastName'] ? '1px solid #ef4444' : '1px solid #e2e8f0',
                          backgroundColor: '#ffffff',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.375rem'
                        }}
                      />
                      {errors['adminUser.lastName'] && (
                        <p className="text-sm text-red-500 mt-1">{errors['adminUser.lastName']}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adminEmail">Email *</Label>
                      <Input
                        id="adminEmail"
                        name="adminEmail"
                        type="email"
                        value={formData.adminUser?.email}
                        onChange={(e) => updateFormData('adminUser', 'email', e.target.value)}
                        placeholder="john.doe@yourbank.co.za"
                        style={{
                          border: errors['adminUser.email'] ? '1px solid #ef4444' : '1px solid #e2e8f0',
                          backgroundColor: '#ffffff',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.375rem'
                        }}
                      />
                      {errors['adminUser.email'] && (
                        <p className="text-sm text-red-500 mt-1">{errors['adminUser.email']}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adminPhone">Phone *</Label>
                      <Input
                        id="adminPhone"
                        name="adminPhone"
                        value={formData.adminUser?.phone}
                        onChange={(e) => updateFormData('adminUser', 'phone', e.target.value)}
                        placeholder="+27101234567"
                        style={{
                          border: errors['adminUser.phone'] ? '1px solid #ef4444' : '1px solid #e2e8f0',
                          backgroundColor: '#ffffff',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.375rem'
                        }}
                      />
                      {errors['adminUser.phone'] && (
                        <p className="text-sm text-red-500 mt-1">{errors['adminUser.phone']}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="idNumber">ID Number *</Label>
                      <Input
                        id="idNumber"
                        name="idNumber"
                        value={formData.adminUser?.idNumber}
                        onChange={(e) => updateFormData('adminUser', 'idNumber', e.target.value)}
                        placeholder="1234567890123"
                        maxLength={13}
                        style={{
                          border: errors['adminUser.idNumber'] ? '1px solid #ef4444' : '1px solid #e2e8f0',
                          backgroundColor: '#ffffff',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.375rem'
                        }}
                      />
                      {errors['adminUser.idNumber'] && (
                        <p className="text-sm text-red-500 mt-1">{errors['adminUser.idNumber']}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="position">Position *</Label>
                      <Input
                        id="position"
                        name="position"
                        value={formData.adminUser?.position}
                        onChange={(e) => updateFormData('adminUser', 'position', e.target.value)}
                        placeholder="Chief Technology Officer"
                        style={{
                          border: errors['adminUser.position'] ? '1px solid #ef4444' : '1px solid #e2e8f0',
                          backgroundColor: '#ffffff',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.375rem'
                        }}
                      />
                      {errors['adminUser.position'] && (
                        <p className="text-sm text-red-500 mt-1">{errors['adminUser.position']}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </FormStep>

            {/* Step 3: Business Details */}
            <FormStep
              title="Business Details"
              description="Business registration and operational information"
              icon={<FileText className="w-5 h-5" style={{ color: '#030213' }} />}
              isActive={currentStep === 3}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number *</Label>
                  <Input
                    id="registrationNumber"
                    name="registrationNumber"
                    value={formData.businessDetails?.registrationNumber}
                    onChange={(e) => updateFormData('businessDetails', 'registrationNumber', e.target.value)}
                    placeholder="2023/123456/07"
                    style={{
                      border: errors['businessDetails.registrationNumber'] ? '1px solid #ef4444' : '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem'
                    }}
                  />
                  {errors['businessDetails.registrationNumber'] && (
                    <p className="text-sm text-red-500 mt-1">{errors['businessDetails.registrationNumber']}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vatNumber">VAT Number</Label>
                  <Input
                    id="vatNumber"
                    name="vatNumber"
                    value={formData.businessDetails?.vatNumber}
                    onChange={(e) => updateFormData('businessDetails', 'vatNumber', e.target.value)}
                    placeholder="4123456789"
                    maxLength={10}
                    style={{
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem'
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    value={formData.businessDetails?.website}
                    onChange={(e) => {
                      let value = e.target.value;
                      // Auto-prepend https:// if user enters a domain without protocol
                      if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
                        value = `https://${value}`;
                      }
                      updateFormData('businessDetails', 'website', value);
                    }}
                    placeholder="https://www.yourbank.co.za"
                    style={{
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem'
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="establishedYear">Established Year</Label>
                  <Input
                    id="establishedYear"
                    name="establishedYear"
                    type="number"
                    value={formData.businessDetails?.establishedYear}
                    onChange={(e) => updateFormData('businessDetails', 'establishedYear', parseInt(e.target.value))}
                    min={1900}
                    max={new Date().getFullYear()}
                    style={{
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem'
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankType">Bank Type *</Label>
                  <Select 
                    name="bankType"
                    value={formData.businessDetails?.bankType} 
                    onValueChange={(value) => updateFormData('businessDetails', 'bankType', value)}
                  >
                    <SelectTrigger 
                      style={{
                        border: errors['businessDetails.bankType'] ? '1px solid #ef4444' : '1px solid #e2e8f0',
                        backgroundColor: '#ffffff',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.375rem'
                      }}
                    >
                      <SelectValue placeholder="Select bank type" />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
                      {BANK_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors['businessDetails.bankType'] && (
                    <p className="text-sm text-red-500 mt-1">{errors['businessDetails.bankType']}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expectedVolume">Expected Volume *</Label>
                  <Select 
                    name="expectedVolume"
                    value={formData.businessDetails?.expectedVolume} 
                    onValueChange={(value) => updateFormData('businessDetails', 'expectedVolume', value)}
                  >
                    <SelectTrigger 
                      style={{
                        border: errors['businessDetails.expectedVolume'] ? '1px solid #ef4444' : '1px solid #e2e8f0',
                        backgroundColor: '#ffffff',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.375rem'
                      }}
                    >
                      <SelectValue placeholder="Select expected volume" />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
                      {EXPECTED_VOLUMES.map((volume) => (
                        <SelectItem key={volume.value} value={volume.value}>
                          {volume.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors['businessDetails.expectedVolume'] && (
                    <p className="text-sm text-red-500 mt-1">{errors['businessDetails.expectedVolume']}</p>
                  )}
                </div>
              </div>
            </FormStep>

            {/* Step 4: Compliance */}
            <FormStep
              title="Compliance & Terms"
              description="Regulatory compliance and agreements"
              icon={<Shield className="w-5 h-5" style={{ color: '#030213' }} />}
              isActive={currentStep === 4}
            >
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sarb_registered"
                    name="sarb_registered"
                    checked={formData.compliance?.sarb_registered}
                    onCheckedChange={(checked) => 
                      updateFormData('compliance', 'sarb_registered', checked)
                    }
                    style={{
                      border: '1px solid #e2e8f0',
                      width: '1rem',
                      height: '1rem'
                    }}
                  />
                  <Label htmlFor="sarb_registered">
                    Our bank is registered with the South African Reserve Bank (SARB)
                  </Label>
                </div>

                {formData.compliance?.sarb_registered && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="sarb_license_number">SARB License Number</Label>
                    <Input
                      id="sarb_license_number"
                      name="sarb_license_number"
                      value={formData.compliance?.sarb_license_number}
                      onChange={(e) => updateFormData('compliance', 'sarb_license_number', e.target.value)}
                      placeholder="License number"
                      style={{
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#ffffff',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.375rem'
                      }}
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="fica_compliant"
                    name="fica_compliant"
                    checked={formData.compliance?.fica_compliant}
                    onCheckedChange={(checked) => 
                      updateFormData('compliance', 'fica_compliant', checked)
                    }
                    style={{
                      border: errors['compliance.fica_compliant'] ? '1px solid #ef4444' : '1px solid #e2e8f0',
                      width: '1rem',
                      height: '1rem'
                    }}
                  />
                  <Label htmlFor="fica_compliant">
                    We are compliant with the Financial Intelligence Centre Act (FICA) *
                  </Label>
                </div>
                {errors['compliance.fica_compliant'] && (
                  <p className="text-sm text-red-500 ml-6 mt-1">{errors['compliance.fica_compliant']}</p>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="popi_compliant"
                    name="popi_compliant"
                    checked={formData.compliance?.popi_compliant}
                    onCheckedChange={(checked) => 
                      updateFormData('compliance', 'popi_compliant', checked)
                    }
                    style={{
                      border: errors['compliance.popi_compliant'] ? '1px solid #ef4444' : '1px solid #e2e8f0',
                      width: '1rem',
                      height: '1rem'
                    }}
                  />
                  <Label htmlFor="popi_compliant">
                    We are compliant with the Protection of Personal Information Act (POPI) *
                  </Label>
                </div>
                {errors['compliance.popi_compliant'] && (
                  <p className="text-sm text-red-500 ml-6 mt-1">{errors['compliance.popi_compliant']}</p>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="accepts_terms"
                    name="accepts_terms"
                    checked={formData.compliance?.accepts_terms}
                    onCheckedChange={(checked) => 
                      updateFormData('compliance', 'accepts_terms', checked)
                    }
                    style={{
                      border: errors['compliance.accepts_terms'] ? '1px solid #ef4444' : '1px solid #e2e8f0',
                      width: '1rem',
                      height: '1rem'
                    }}
                  />
                  <Label htmlFor="accepts_terms">
                    I accept the Rails Terms of Service and Privacy Policy *
                  </Label>
                </div>
                {errors['compliance.accepts_terms'] && (
                  <p className="text-sm text-red-500 ml-6 mt-1">{errors['compliance.accepts_terms']}</p>
                )}
              </div>
            </FormStep>

            {/* Error Display */}
            {state.registrationError && (
              <Alert 
                className="mb-6"
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  padding: '1rem',
                  borderRadius: '0.375rem'
                }}
              >
                <AlertCircle className="h-4 w-4" style={{ color: '#dc2626' }} />
                <AlertDescription style={{ color: '#dc2626' }}>
                  {state.registrationError}
                </AlertDescription>
              </Alert>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                style={{
                  backgroundColor: currentStep === 1 ? '#f3f3f5' : '#ffffff',
                  border: '1px solid #e2e8f0',
                  color: currentStep === 1 ? '#717182' : '#030213',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  cursor: currentStep === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </Button>

              {currentStep < 4 ? (
                <Button 
                  type="button" 
                  onClick={nextStep}
                  style={{
                    backgroundColor: '#030213',
                    color: '#ffffff',
                    border: '1px solid #030213',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#02020f';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#030213';
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={state.registrationLoading}
                  className="min-w-[120px]"
                  style={{
                    backgroundColor: state.registrationLoading ? '#717182' : '#030213',
                    color: '#ffffff',
                    border: `1px solid ${state.registrationLoading ? '#717182' : '#030213'}`,
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    cursor: state.registrationLoading ? 'not-allowed' : 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (!state.registrationLoading) {
                      e.target.style.backgroundColor = '#02020f';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!state.registrationLoading) {
                      e.target.style.backgroundColor = '#030213';
                    }
                  }}
                >
                  {state.registrationLoading ? 'Registering...' : 'Submit Registration'}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}