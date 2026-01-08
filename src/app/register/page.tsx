"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

function RegisterPageContent() {
  const { t } = useLanguage();
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showBackArrow, setShowBackArrow] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Get invitation parameters from URL
  const invitationId = searchParams.get('invitation');
  const companyId = searchParams.get('company');
  
  // Account type selection
  const [accountType, setAccountType] = useState<'personal' | 'business'>('personal');
  
  // Form data
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    companyName: "",
    kvkNumber: "",
    vatNumber: "",
    companyPhone: "",
    businessAddress: {
      country: "",
      postalCode: "",
      houseNumber: "",
      street: "",
      city: ""
    } as BusinessAddress
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [kvkDocument, setKvkDocument] = useState<File | null>(null);
  const [kvkDocumentPreview, setKvkDocumentPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackArrow(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith("businessAddress.")) {
      const field = name.split(".")[1] as keyof BusinessAddress;
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
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          kvkDocument: "Bestand is te groot. Maximum grootte is 5MB."
        }));
        return;
      }
      setKvkDocument(file);
      setKvkDocumentPreview(URL.createObjectURL(file));
      if (errors.kvkDocument) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.kvkDocument;
          return newErrors;
        });
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Common validations
    if (!formData.email.trim()) {
      newErrors.email = "E-mailadres is verplicht";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Ongeldig e-mailadres";
    }

    if (!formData.password) {
      newErrors.password = "Wachtwoord is verplicht";
    } else if (formData.password.length < 8) {
      newErrors.password = "Wachtwoord moet minimaal 8 tekens lang zijn";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Wachtwoorden komen niet overeen";
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Voornaam is verplicht";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Achternaam is verplicht";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Telefoonnummer is verplicht";
    }

    // Business-specific validations
    if (accountType === 'business') {
      if (!formData.companyName.trim()) {
        newErrors.companyName = "Bedrijfsnaam is verplicht";
      }

      if (!formData.kvkNumber.trim()) {
        newErrors.kvkNumber = "KVK-nummer is verplicht";
      } else if (!/^\d{8}$/.test(formData.kvkNumber.replace(/\s/g, ''))) {
        newErrors.kvkNumber = "KVK-nummer moet 8 cijfers bevatten";
      }

      if (!kvkDocument) {
        newErrors.kvkDocument = "KVK-document is verplicht";
      }

      if (!formData.businessAddress.street.trim()) {
        newErrors["businessAddress.street"] = "Straat is verplicht";
      }

      if (!formData.businessAddress.houseNumber.trim()) {
        newErrors["businessAddress.houseNumber"] = "Huisnummer is verplicht";
      }

      if (!formData.businessAddress.postalCode.trim()) {
        newErrors["businessAddress.postalCode"] = "Postcode is verplicht";
      }

      if (!formData.businessAddress.city.trim()) {
        newErrors["businessAddress.city"] = "Stad is verplicht";
      }

      if (!formData.businessAddress.country.trim()) {
        newErrors["businessAddress.country"] = "Land is verplicht";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Upload KVK document if business account
      let kvkDocumentPath = null;
      if (accountType === 'business' && kvkDocument) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', kvkDocument);
        formDataUpload.append('type', 'kvk-document');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Upload mislukt');
        }

        const uploadData = await uploadResponse.json();
        kvkDocumentPath = uploadData.path;
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
        }),
        ...(invitationId && { invitationId }),
        ...(companyId && { companyId })
      };
      
      console.log('Calling register with data:', registrationData);
      const result = await register(registrationData);

      if (result.success) {
        setShowSuccessModal(true);
      } else {
        setErrors({ submit: result.error || "Registratie mislukt" });
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      setErrors({ submit: error.message || "Registratie mislukt" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white relative overflow-hidden">
      {/* Background Bubbles */}
      <Bubble>{null}</Bubble>
      
      {/* Back Arrow */}
      {showBackArrow && (
        <button
          onClick={() => router.back()}
          className="fixed top-6 left-6 z-50 bg-white/80 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-all"
          aria-label="Go back"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t.register || "Registreren"}
          </h1>
          <p className="text-gray-600 text-lg">
            Maak een account aan om te beginnen
          </p>
        </div>

        {/* Account Type Selection */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Selecteer accounttype
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                setAccountType('personal');
                setErrors({});
              }}
              className={`p-6 rounded-xl border-2 transition-all ${
                accountType === 'personal'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">👤</div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Persoonlijk Account
                </h3>
                <p className="text-sm text-gray-600">
                  Voor individuele gebruikers
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setAccountType('business');
                setErrors({});
              }}
              className={`p-6 rounded-xl border-2 transition-all ${
                accountType === 'business'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">🏢</div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Bedrijfsaccount
                </h3>
                <p className="text-sm text-gray-600">
                  Voor bedrijven en organisaties
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {/* Common Fields */}
          <div className="space-y-4 mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Persoonlijke gegevens
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  {t.firstName || "Voornaam"} *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  {t.lastName || "Achternaam"} *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                {t.email || "E-mailadres"} *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                {t.phone || "Telefoonnummer"} *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  {t.password || "Wachtwoord"} *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Bevestig wachtwoord *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
          </div>

          {/* Business Fields */}
          {accountType === 'business' && (
            <div className="space-y-4 mb-6 border-t pt-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Bedrijfsgegevens
              </h2>

              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                  Bedrijfsnaam *
                </label>
                <input
                  type="text"
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.companyName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.companyName && (
                  <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="kvkNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    KVK-nummer *
                  </label>
                  <input
                    type="text"
                    id="kvkNumber"
                    name="kvkNumber"
                    value={formData.kvkNumber}
                    onChange={handleInputChange}
                    placeholder="12345678"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.kvkNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.kvkNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.kvkNumber}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="vatNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    BTW-nummer
                  </label>
                  <input
                    type="text"
                    id="vatNumber"
                    name="vatNumber"
                    value={formData.vatNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="companyPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Bedrijfstelefoon
                </label>
                <input
                  type="tel"
                  id="companyPhone"
                  name="companyPhone"
                  value={formData.companyPhone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Business Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Bedrijfsadres
                </h3>

                <div>
                  <label htmlFor="businessAddress.street" className="block text-sm font-medium text-gray-700 mb-1">
                    Straat *
                  </label>
                  <input
                    type="text"
                    id="businessAddress.street"
                    name="businessAddress.street"
                    value={formData.businessAddress.street}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors["businessAddress.street"] ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors["businessAddress.street"] && (
                    <p className="mt-1 text-sm text-red-600">{errors["businessAddress.street"]}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="businessAddress.houseNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Huisnummer *
                    </label>
                    <input
                      type="text"
                      id="businessAddress.houseNumber"
                      name="businessAddress.houseNumber"
                      value={formData.businessAddress.houseNumber}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        errors["businessAddress.houseNumber"] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors["businessAddress.houseNumber"] && (
                      <p className="mt-1 text-sm text-red-600">{errors["businessAddress.houseNumber"]}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="businessAddress.postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                      Postcode *
                    </label>
                    <input
                      type="text"
                      id="businessAddress.postalCode"
                      name="businessAddress.postalCode"
                      value={formData.businessAddress.postalCode}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        errors["businessAddress.postalCode"] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors["businessAddress.postalCode"] && (
                      <p className="mt-1 text-sm text-red-600">{errors["businessAddress.postalCode"]}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="businessAddress.city" className="block text-sm font-medium text-gray-700 mb-1">
                      Stad *
                    </label>
                    <input
                      type="text"
                      id="businessAddress.city"
                      name="businessAddress.city"
                      value={formData.businessAddress.city}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                        errors["businessAddress.city"] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors["businessAddress.city"] && (
                      <p className="mt-1 text-sm text-red-600">{errors["businessAddress.city"]}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="businessAddress.country" className="block text-sm font-medium text-gray-700 mb-1">
                    Land *
                  </label>
                  <input
                    type="text"
                    id="businessAddress.country"
                    name="businessAddress.country"
                    value={formData.businessAddress.country}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors["businessAddress.country"] ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors["businessAddress.country"] && (
                    <p className="mt-1 text-sm text-red-600">{errors["businessAddress.country"]}</p>
                  )}
                </div>
              </div>

              {/* KVK Document Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  KVK-document *
                </label>
                <div className="mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 transition-colors text-gray-600"
                  >
                    {kvkDocument ? kvkDocument.name : "Selecteer bestand"}
                  </button>
                  {kvkDocumentPreview && (
                    <div className="mt-2">
                      <img src={kvkDocumentPreview} alt="Preview" className="max-w-xs rounded-lg" />
                    </div>
                  )}
                </div>
                {errors.kvkDocument && (
                  <p className="mt-1 text-sm text-red-600">{errors.kvkDocument}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Maximale bestandsgrootte: 5MB
                </p>
              </div>
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-6 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Registreren..." : (t.register || "Registreren")}
          </button>
        </form>

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Registratie succesvol!
                </h3>
                <p className="text-gray-600 mb-6">
                  {accountType === 'business' 
                    ? "Uw bedrijfsaccount is aangemaakt en wacht op goedkeuring van een beheerder."
                    : "Uw account is succesvol aangemaakt. U kunt nu inloggen."}
                </p>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    router.push('/login');
                  }}
                  className="w-full py-2 px-6 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                >
                  Naar inloggen
                </button>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full mt-3 py-2 px-6 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                >
                  Sluiten
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>}>
      <RegisterPageContent />
    </Suspense>
  );
}
