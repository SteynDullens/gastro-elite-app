"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import Bubble from "@/components/Bubble";

interface BusinessAddress {
  country: string;
  postalCode: string;
  houseNumber: string;
  street: string;
  city: string;
}

export default function RegisterPage() {
  const { t } = useLanguage();
  const { register } = useAuth();
  const router = useRouter();
  const [showBackArrow, setShowBackArrow] = useState(false);
  const [mounted, setMounted] = useState(false);
  
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
      houseNumber: "",
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
  const [addressLookupLoading, setAddressLookupLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addressLookupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle mount and scroll
  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Show arrow if there's history OR if scrolled down
      const hasHistory = window.history.length > 1;
      setShowBackArrow(hasHistory || scrollY > 100);
    };

    // Initial check
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Check if mobile and redirect after mount
  useEffect(() => {
    if (mounted) {
      const checkMobile = () => {
        const isMobileDevice = window.innerWidth < 768;
        if (isMobileDevice) {
          router.push('/mobile-startup');
        }
      };
      
      // Small delay to prevent hydration issues
      const timer = setTimeout(checkMobile, 100);
      return () => clearTimeout(timer);
    }
  }, [mounted, router]);

  // Handle back navigation
  const handleBackClick = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('businessAddress.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        businessAddress: {
          ...prev.businessAddress,
          [field]: value
        }
      }));

      // Auto-fill address when postal code and house number are both filled
      if (field === 'postalCode' || field === 'houseNumber') {
        // Clear existing timeout
        if (addressLookupTimeoutRef.current) {
          clearTimeout(addressLookupTimeoutRef.current);
        }

        // Get current values and clean postal code
        const rawPostalCode = field === 'postalCode' ? value : formData.businessAddress.postalCode;
        const currentPostalCode = rawPostalCode.trim().toUpperCase().replace(/\s+/g, '');
        const currentHouseNumber = field === 'houseNumber' ? value : formData.businessAddress.houseNumber;
        
        // Debounce: wait 1 second after user stops typing, then lookup
        addressLookupTimeoutRef.current = setTimeout(() => {
          if (currentPostalCode && currentHouseNumber && currentPostalCode.length >= 6 && currentHouseNumber.trim().length > 0) {
            lookupAddress(currentPostalCode, currentHouseNumber);
          }
        }, 1000); // 1 second delay
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const lookupAddress = async (postalCode: string, houseNumber: string) => {
    // Clean postal code: remove spaces, make uppercase
    const cleanPostalCode = postalCode.trim().toUpperCase().replace(/\s+/g, '');
    const cleanHouseNumber = houseNumber.trim();
    
    if (!cleanPostalCode || !cleanHouseNumber || cleanPostalCode.length < 6) {
      return;
    }

    setAddressLookupLoading(true);
    try {
      const response = await fetch(`/api/address/lookup?postalCode=${encodeURIComponent(cleanPostalCode)}&houseNumber=${encodeURIComponent(cleanHouseNumber)}`);
      const data = await response.json();
      
      console.log('Address lookup response:', data);
      
      if (data.success) {
        // Always update with the API response values, even if they're empty strings
        const newStreet = data.street !== undefined ? data.street : '';
        const newCity = data.city !== undefined ? data.city : '';
        
        console.log('Updating form with:', { street: newStreet, city: newCity });
        
        setFormData(prev => {
          const updated = {
            ...prev,
            businessAddress: {
              ...prev.businessAddress,
              street: newStreet,
              city: newCity,
              postalCode: data.postalCode || cleanPostalCode
            }
          };
          console.log('Form data after update:', updated.businessAddress);
          return updated;
        });
        
        console.log('Address updated successfully:', { street: newStreet, city: newCity });
        
        // If we got partial data, make fields editable
        if (!newStreet || !newCity) {
          console.warn('Partial address data received. User can fill remaining fields manually.');
        }
      } else {
        console.warn('Address lookup returned no results:', data.message || data.error);
        // Don't clear existing values, just leave them as-is so user can edit manually
      }
    } catch (error) {
      console.error('Address lookup error:', error);
      // Clear fields on error
      setFormData(prev => ({
        ...prev,
        businessAddress: {
          ...prev.businessAddress,
          street: '',
          city: ''
        }
      }));
    } finally {
      setAddressLookupLoading(false);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (addressLookupTimeoutRef.current) {
        clearTimeout(addressLookupTimeoutRef.current);
      }
    };
  }, []);

  // Debug: Log when address fields change
  useEffect(() => {
    console.log('Address fields changed:', {
      street: formData.businessAddress.street,
      city: formData.businessAddress.city,
      postalCode: formData.businessAddress.postalCode,
      houseNumber: formData.businessAddress.houseNumber
    });
  }, [formData.businessAddress.street, formData.businessAddress.city]);

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
      if (!formData.companyName || !formData.kvkNumber) {
        setError("Bedrijfsnaam en KvK nummer zijn verplicht");
        setLoading(false);
        return;
      }
      if (!kvkDocument) {
        setError("KvK uittreksel is verplicht voor een bedrijfsaccount");
        setLoading(false);
        return;
      }
    }

    try {
      // Upload KvK document if business account and document provided
      let kvkDocumentPath = '';
      let kvkDocumentData = '';
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
        // If base64 data is returned (fallback mode), store it
        if (uploadResult.documentData) {
          kvkDocumentData = uploadResult.documentData;
        }
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
          kvkDocumentPath,
          kvkDocumentData
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
            houseNumber: "",
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
      setError(error.message || "Er is een fout opgetreden bij de registratie");
    } finally {
      setLoading(false);
      setUploadingDocument(false);
    }
  };

  // Show loading state while mounting
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white">
        <div className="text-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Mobile Logo - Only visible on mobile */}
        <div className="text-center mb-6 sm:hidden">
          <Image 
            src="/logo.svg" 
            alt="Gastro-Elite Logo" 
            width={64}
            height={64}
            className="mx-auto mb-4"
            priority
          />
        </div>
        
        <div className="bg-white border border-orange-300 rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 relative">
          {/* Sticky Back Arrow - Above the form */}
          <button
            onClick={handleBackClick}
            className="absolute -top-4 -left-4 z-50 bg-white hover:bg-gray-50 border border-orange-300 rounded-full p-3 shadow-lg transition-all duration-300"
            title="Terug"
          >
            <svg 
              className="w-5 h-5 text-orange-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 19l-7-7 7-7" 
              />
            </svg>
          </button>
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Account Aanmaken</h1>
            <p className="text-gray-600 text-sm sm:text-base">Maak uw Gastro-Elite account aan</p>
          </div>
        
          {/* Account Type Selection */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                type="button"
                onClick={() => setAccountType('personal')}
                className={`px-4 sm:px-6 py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${
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
                className={`px-4 sm:px-6 py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${
                  accountType === 'business'
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Bedrijfsaccount
              </button>
            </div>
          </div>


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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Voornaam *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Achternaam *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                E-mailadres *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                          className="w-full max-w-sm mx-auto px-4 py-3 border border-orange-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Telefoonnummer *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                          className="w-full max-w-sm mx-auto px-4 py-3 border border-orange-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              />
            </div>

            <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Wachtwoord *
                </label>
                <div className="relative max-w-sm mx-auto sm:max-w-none">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Bevestig Wachtwoord *
                </label>
                <div className="relative max-w-sm mx-auto sm:max-w-none">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
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
                  <h3 className="text-lg font-semibold text-gray-800 mb-6">Bedrijfsinformatie</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Bedrijfsnaam *
                      </label>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        KvK Nummer *
                      </label>
                      <input
                        type="text"
                        name="kvkNumber"
                        value={formData.kvkNumber}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        BTW Nummer
                      </label>
                      <input
                        type="text"
                        name="vatNumber"
                        value={formData.vatNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        <span>Zakelijk telefoonnummer</span>
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="tel"
                        name="companyPhone"
                        value={formData.companyPhone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-700 mb-4">Bedrijfsadres</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      {/* Land - First row, full width */}
                      <div className="space-y-2 sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Land *
                        </label>
                        <input
                          type="text"
                          name="businessAddress.country"
                          value={formData.businessAddress.country}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-orange-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors bg-gray-50"
                          readOnly
                        />
                      </div>
                      
                      {/* Postcode and Huisnummer - Second row */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Postcode *
                        </label>
                        <input
                          type="text"
                          name="businessAddress.postalCode"
                          value={formData.businessAddress.postalCode}
                          onChange={handleInputChange}
                          onBlur={(e) => {
                            // Trigger lookup immediately when user leaves the field
                            const postalCode = e.target.value.trim().toUpperCase().replace(/\s+/g, '');
                            const houseNumber = formData.businessAddress.houseNumber.trim();
                            if (postalCode.length >= 6 && houseNumber.length > 0) {
                              // Clear any pending timeout
                              if (addressLookupTimeoutRef.current) {
                                clearTimeout(addressLookupTimeoutRef.current);
                              }
                              lookupAddress(postalCode, houseNumber);
                            }
                          }}
                          placeholder="1234AB"
                          maxLength={7}
                          className="w-full px-4 py-3 border border-orange-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                          style={{ textTransform: 'uppercase' }}
                        />
                        <p className="text-xs text-gray-500">Vul postcode in (bijv. 1234AB)</p>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Huisnummer *
                        </label>
                        <input
                          type="text"
                          name="businessAddress.houseNumber"
                          value={formData.businessAddress.houseNumber}
                          onChange={handleInputChange}
                          onBlur={(e) => {
                            // Trigger lookup immediately when user leaves the field
                            const postalCode = formData.businessAddress.postalCode.trim().toUpperCase().replace(/\s+/g, '');
                            const houseNumber = e.target.value.trim();
                            if (postalCode.length >= 6 && houseNumber.length > 0) {
                              // Clear any pending timeout
                              if (addressLookupTimeoutRef.current) {
                                clearTimeout(addressLookupTimeoutRef.current);
                              }
                              lookupAddress(postalCode, houseNumber);
                            }
                          }}
                          placeholder="12"
                          className="w-full px-4 py-3 border border-orange-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        />
                        <p className="text-xs text-gray-500">
                          {addressLookupLoading ? (
                            <span className="flex items-center gap-1">
                              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                              </svg>
                              Adres wordt opgezocht...
                            </span>
                          ) : (
                            "Straat en plaats worden automatisch ingevuld"
                          )}
                        </p>
                      </div>
                      
                      {/* Straat - Third row, full width */}
                      <div className="space-y-2 sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                          <span>Straat</span>
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="businessAddress.street"
                            value={formData.businessAddress.street ?? ''}
                            onChange={handleInputChange}
                            required
                            className={`w-full px-4 py-3 border border-orange-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${formData.businessAddress.street ? 'bg-gray-50' : 'bg-white'}`}
                            readOnly={!!formData.businessAddress.street}
                            placeholder={addressLookupLoading ? "Zoeken..." : (formData.businessAddress.street ? "" : "Wordt automatisch ingevuld")}
                            data-testid="street-input"
                          />
                          {/* Debug display */}
                          {process.env.NODE_ENV === 'development' && (
                            <div className="text-xs text-gray-400 mt-1">
                              Debug: {formData.businessAddress.street || '(empty)'}
                            </div>
                          )}
                          {addressLookupLoading && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <svg className="animate-spin h-5 w-5 text-orange-500" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Plaats - Fourth row, full width */}
                      <div className="space-y-2 sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                          <span>Plaats</span>
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="businessAddress.city"
                            value={formData.businessAddress.city ?? ''}
                            onChange={handleInputChange}
                            required
                            className={`w-full px-4 py-3 border border-orange-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${formData.businessAddress.city ? 'bg-gray-50' : 'bg-white'}`}
                            readOnly={!!formData.businessAddress.city}
                            placeholder={addressLookupLoading ? "Zoeken..." : (formData.businessAddress.city ? "" : "Wordt automatisch ingevuld")}
                            data-testid="city-input"
                          />
                          {addressLookupLoading && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <svg className="animate-spin h-5 w-5 text-orange-500" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                              </svg>
                            </div>
                          )}
                          {/* Debug display */}
                          {process.env.NODE_ENV === 'development' && (
                            <div className="text-xs text-gray-400 mt-1">
                              Debug: {formData.businessAddress.city || '(empty)'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      KvK Uittreksel *
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        required
                        className="hidden"
                        id="kvk-document-input"
                      />
                      <label
                        htmlFor="kvk-document-input"
                        className="cursor-pointer px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors text-sm font-medium"
                      >
                        {t.chooseFile}
                      </label>
                      <span className="text-sm text-gray-600">
                        {kvkDocument ? kvkDocument.name : t.noFileSelected}
                      </span>
                    </div>
                    {kvkDocument && (
                      <p className="text-xs text-green-600 mt-2">
                        ✓ {kvkDocument.name}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Verplicht. Alleen PDF, JPG en PNG bestanden. Maximaal 5MB.
                    </p>
                  </div>
                </div>
              </>
            )}

            <div className="pt-6 flex justify-center">
              <button
                type="submit"
                disabled={loading || uploadingDocument}
                className="w-full max-w-sm bg-orange-500 text-white py-3 px-6 rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
    </div>
  );
}