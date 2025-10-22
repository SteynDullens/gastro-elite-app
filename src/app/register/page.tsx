"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import Bubble, { BackBubble } from "@/components/Bubble";

interface BusinessAddress {
  country: string;
  postalCode: string;
  street: string;
  city: string;
}

export default function RegisterPage() {
  const { t } = useLanguage();
  const { register } = useAuth();
  const router = useRouter();
  
  // Account type selection
  const [accountType, setAccountType] = useState<'personal' | 'business'>('personal');
  
  // Form data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    // Business fields
    companyName: "",
    kvkNumber: "",
    vatNumber: "",
    companyPhone: "",
    businessAddress: {
      country: "Nederland",
      postalCode: "",
      street: "",
      city: ""
    } as BusinessAddress,
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [kvkDocument, setKvkDocument] = useState<File | null>(null);
  const [debugInfo, setDebugInfo] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDebugInfo('Input changed: ' + name + ' = ' + value);
    
    if (name.startsWith('businessAddress.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        businessAddress: {
          ...prev.businessAddress,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('File selected:', file);
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setError('Alleen PDF, JPG en PNG bestanden zijn toegestaan');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Bestand is te groot. Maximum grootte is 5MB');
        return;
      }
      
      setKvkDocument(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDebugInfo('Form submission started!');
    setLoading(true);
    setError("");
    setSuccess("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Wachtwoorden komen niet overeen");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Wachtwoord moet minimaal 6 karakters lang zijn");
      setLoading(false);
      return;
    }

    if (accountType === 'business') {
      setDebugInfo('Business validation - companyName: ' + formData.companyName + ', kvkNumber: ' + formData.kvkNumber);
      if (!formData.companyName || !formData.kvkNumber) {
        setError("Bedrijfsnaam en KvK nummer zijn verplicht");
        setLoading(false);
        return;
      }
      setDebugInfo('Business validation passed');
    }

    try {
      // Upload KvK document if business account and document provided
      let kvkDocumentPath = '';
      console.log('Account type:', accountType, 'KvK document:', kvkDocument);
      if (accountType === 'business' && kvkDocument) {
        setUploadingDocument(true);
        const uploadFormData = new FormData();
        uploadFormData.append('document', kvkDocument!);
        uploadFormData.append('kvkNumber', formData.kvkNumber);
        
        const uploadResponse = await fetch('/api/auth/upload-kvk-document', {
          method: 'POST',
          body: uploadFormData,
        });
        
        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json();
          throw new Error(uploadError.error || 'Fout bij uploaden van KvK document');
        }
        
        const uploadResult = await uploadResponse.json();
        kvkDocumentPath = uploadResult.documentPath;
        setUploadingDocument(false);
      }

      // Register user
      const registrationData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: (accountType === 'personal' ? 'user' : 'business') as 'user' | 'business',
        ...(accountType === 'business' && {
          companyName: formData.companyName,
          kvkNumber: formData.kvkNumber,
          vatNumber: formData.vatNumber,
          companyPhone: formData.companyPhone,
          businessAddress: formData.businessAddress,
          kvkDocumentPath
        })
      };

      console.log('Calling register with data:', registrationData);
      const result = await register(registrationData);
      console.log('Register result:', result);
      
      if (result.success) {
        setSuccess(result.message || (
          accountType === 'business' 
            ? "Bedrijfsaccount registratie succesvol! U ontvangt een bevestigingsmail en uw account wordt binnen 24 uur beoordeeld."
            : "Account succesvol aangemaakt! Controleer uw email voor verificatie."
        ));
        
        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          confirmPassword: "",
          phone: "",
          companyName: "",
          kvkNumber: "",
          vatNumber: "",
          companyPhone: "",
          businessAddress: {
            country: "Nederland",
            postalCode: "",
            street: "",
            city: ""
          }
        });
        setKvkDocument(null);
        if (fileInputRef.current) {
          fileInputRef.current!.value = '';
        }
      } else {
        setError(result.error || "Er is een fout opgetreden bij de registratie");
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setDebugInfo('Registration error: ' + error.message);
      setError(error.message || "Er is een fout opgetreden bij de registratie");
    } finally {
      setLoading(false);
      setUploadingDocument(false);
    }
  };

  return (
    <div className="bubble-grid max-w-4xl mx-auto">
      <BackBubble showCondition={true} />
      
      <div className="bubble col-span-full text-center">
        <h1 className="text-3xl font-bold mb-6">Account Aanmaken</h1>
        
        {/* Account Type Selection */}
        <div className="mb-8">
          <div className="flex justify-center space-x-4">
            <button
              type="button"
              onClick={() => setAccountType('personal')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                accountType === 'personal'
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Persoonlijk Account
            </button>
            <button
              type="button"
              onClick={() => setAccountType('business')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                accountType === 'business'
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Bedrijfsaccount
            </button>
          </div>
        </div>

        {/* Debug Info */}
        {debugInfo && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded-lg text-sm text-yellow-800">
            Debug: {debugInfo}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 rounded-lg text-green-800">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 rounded-lg text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voornaam *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Achternaam *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-mailadres *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefoonnummer *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wachtwoord *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bevestig Wachtwoord *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
          </div>

          {/* Business Information */}
          {accountType === 'business' && (
            <>
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Bedrijfsinformatie</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bedrijfsnaam *
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      KvK Nummer *
                    </label>
                    <input
                      type="text"
                      name="kvkNumber"
                      value={formData.kvkNumber}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      BTW Nummer
                    </label>
                    <input
                      type="text"
                      name="vatNumber"
                      value={formData.vatNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bedrijfstelefoon
                    </label>
                    <input
                      type="tel"
                      name="companyPhone"
                      value={formData.companyPhone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-md font-medium text-gray-700 mb-3">Bedrijfsadres</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Straat
                      </label>
                      <input
                        type="text"
                        name="businessAddress.street"
                        value={formData.businessAddress.street}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Postcode
                      </label>
                      <input
                        type="text"
                        name="businessAddress.postalCode"
                        value={formData.businessAddress.postalCode}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Plaats
                      </label>
                      <input
                        type="text"
                        name="businessAddress.city"
                        value={formData.businessAddress.city}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Land
                      </label>
                      <input
                        type="text"
                        name="businessAddress.country"
                        value={formData.businessAddress.country}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    KvK Uittreksel (optioneel)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Alleen PDF, JPG en PNG bestanden. Maximaal 5MB.
                  </p>
                </div>
              </div>
            </>
          )}

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading || uploadingDocument}
              className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading || uploadingDocument ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {uploadingDocument ? 'Document uploaden...' : 'Account aanmaken...'}
                </span>
              ) : (
                'Account Aanmaken'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}