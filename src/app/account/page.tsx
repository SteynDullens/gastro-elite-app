"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage, availableLanguages } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NextImage from "next/image";

// Tab types for business account
type BusinessTab = 'edit-details' | 'language' | 'employees' | 'logout';

export default function AccountPage() {
  const { t, language, setLanguage } = useLanguage();
  const { user, logout, loading, isBusiness } = useAuth();
  const router = useRouter();
  
  // Active tab state for business users
  const [activeTab, setActiveTab] = useState<BusinessTab>('edit-details');
  
  // All useState hooks must be declared at the top, before any conditional logic
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [userProfile, setUserProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    avatar: null,
  });
  
  // Modal states (for non-business users)
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [languageSearch, setLanguageSearch] = useState("");
  
  // Profile photo upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Profile photo editor
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [cropData, setCropData] = useState({
    x: 0,
    y: 0,
    scale: 1,
  });
  
  // Touch controls for mobile
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouch, setLastTouch] = useState({ x: 0, y: 0 });
  const [lastScale, setLastScale] = useState(1);
  const [touchStartDistance, setTouchStartDistance] = useState(0);
  
  // Professional photo editor state
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  
  // Edit profile form data
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    country: "",
    postalCode: "",
    street: "",
    city: "",
  });
  
  // Change password form data
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    pushNotifications: false,
    emailNotifications: false,
  });

  // Business-related state
  const [company, setCompany] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [businessError, setBusinessError] = useState("");
  const [businessSuccess, setBusinessSuccess] = useState("");

  const fetchCompanyData = useCallback(async () => {
    if (!user?.companyId) return;
    const companyId = user.companyId;

    try {
      const [companyResponse, employeesResponse] = await Promise.all([
        fetch(`/api/company/${companyId}`),
        fetch(`/api/company/${companyId}/employees`)
      ]);

      if (companyResponse.ok) {
        const companyData = await companyResponse.json();
        setCompany(companyData);
      }

      if (employeesResponse.ok) {
        const employeesData = await employeesResponse.json();
        setEmployees(employeesData.employees || []);
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
    }
  }, [user?.companyId]);

  // Update user profile when user data changes
  useEffect(() => {
    if (user) {
      setUserProfile(prev => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        company: String(user.companyId || ""),
        address: (user as any).address || "",
        avatar: (user as any).avatar || null,
      }));
      
      // Update edit form data
      setEditFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        company: String(user.companyId || ""),
        country: (user as any).country || "",
        postalCode: (user as any).postalCode || "",
        street: (user as any).street || "",
        city: (user as any).city || "",
      });

      // Fetch company data for business users
      if (isBusiness && user.companyId) {
        fetchCompanyData();
      }
    }
  }, [user, isBusiness, fetchCompanyData]);

  // Business functions
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusinessError("");
    setBusinessSuccess("");

    if (!employeeEmail) {
      setBusinessError("Voer een e-mailadres in");
      return;
    }

    try {
      const response = await fetch(`/api/company/${user?.companyId}/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: employeeEmail }),
      });

      if (response.ok) {
        setBusinessSuccess("Employee invitation sent successfully!");
        setEmployeeEmail("");
        setShowAddEmployee(false);
        fetchCompanyData(); // Refresh employee list
      } else {
        const errorData = await response.json();
        setBusinessError(errorData.message || "Uitnodiging verzenden mislukt");
      }
    } catch (error) {
      setBusinessError("Uitnodiging verzenden mislukt");
    }
  };

  const handleRemoveEmployee = async (employeeId: number) => {
    try {
      const response = await fetch(`/api/company/${user?.companyId}/employees/${employeeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBusinessSuccess("Employee removed successfully!");
        fetchCompanyData(); // Refresh employee list
      } else {
        setBusinessError("Medewerker verwijderen mislukt");
      }
    } catch (error) {
      setBusinessError("Medewerker verwijderen mislukt");
    }
  };

  // Profile photo upload handler
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setSelectedImage(imageUrl);
      setShowPhotoEditor(true);
      
      // Calculate image dimensions and set minimum scale
      const img = new window.Image();
      img.onload = () => {
        const { width, height } = img;
        setImageDimensions({ width, height });
        
        // Calculate minimum scale to fill the circle completely
        const circleSize = 256; // 64 * 4 (w-64 h-64)
        const minScale = Math.max(circleSize / width, circleSize / height);
        
        setCropData(prev => ({
          ...prev,
          scale: Math.max(minScale, 1) // Ensure minimum scale to fill circle
        }));
        setImageLoaded(true);
      };
      img.src = imageUrl;
    };
    reader.readAsDataURL(file);
  };

  // Handle photo crop and save
  const handleSavePhoto = async () => {
    if (!selectedImage) return;

    setUploadingPhoto(true);
    try {
      // Create a canvas to crop the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new window.Image();
      
      img.onload = async () => {
        const size = 200; // Profile image size
        canvas.width = size;
        canvas.height = size;
        
        if (ctx) {
          // Draw circular crop
          ctx.save();
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          
          // Calculate crop area
          const cropSize = Math.min(img.width, img.height) * cropData.scale;
          const sourceX = (img.width - cropSize) / 2 + cropData.x;
          const sourceY = (img.height - cropSize) / 2 + cropData.y;
          
          ctx.drawImage(
            img,
            sourceX, sourceY, cropSize, cropSize,
            0, 0, size, size
          );
          ctx.restore();
        }
        
        // Convert to blob and upload
        canvas.toBlob(async (blob) => {
          if (blob) {
            const formData = new FormData();
            formData.append('photo', blob, 'profile.jpg');

            const response = await fetch('/api/auth/upload-photo', {
              method: 'POST',
              body: formData,
            });

            if (response.ok) {
              const data = await response.json();
              setUserProfile(prev => ({ ...prev, avatar: data.avatar }));
              setShowPhotoEditor(false);
              setSelectedImage(null);
              setCropData({ x: 0, y: 0, scale: 1 });
              router.refresh();
              alert('Profielfoto succesvol bijgewerkt!');
            } else {
              const errorData = await response.json().catch(() => ({ message: 'Server error' }));
              console.error('Upload failed:', errorData);
              alert(`Fout bij uploaden: ${errorData.message || 'Onbekende fout'}`);
            }
          } else {
            alert('Fout bij verwerken van afbeelding');
          }
        }, 'image/jpeg', 0.9);
      };
      
      img.src = selectedImage;
    } catch (error) {
      console.error('Photo upload error:', error);
      alert('Er is een fout opgetreden bij het uploaden van de foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Edit profile handler
  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        setUserProfile(prev => ({ ...prev, ...editFormData }));
        setShowEditModal(false);
        router.refresh();
        alert('Profiel succesvol bijgewerkt!');
      } else {
        const errorData = await response.json();
        alert(`Fout bij bijwerken: ${errorData.message || 'Onbekende fout'}`);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Er is een fout opgetreden bij het bijwerken van uw profiel.');
    }
  };

  // Change password handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordFormData),
      });

      if (response.ok) {
        setShowPasswordModal(false);
        setPasswordFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        alert('Password updated successfully');
      } else {
        alert('Failed to update password');
      }
    } catch (error) {
      console.error('Password change error:', error);
    }
  };

  // Handle postal code lookup
  const handlePostalCodeChange = async (postalCode: string) => {
    setEditFormData(prev => ({ ...prev, postalCode }));
    
    if (postalCode.length >= 4) {
      try {
        // In a real app, you would call a postal code API here
        // For now, we'll simulate with a simple lookup
        const response = await fetch(`/api/postal-lookup?code=${postalCode}`);
        if (response.ok) {
          const data = await response.json();
          setEditFormData(prev => ({ 
            ...prev, 
            street: data.street || '',
            city: data.city || ''
          }));
        }
      } catch (error) {
        console.log('Postal code lookup not available');
      }
    }
  };

  // Handle notification settings
  const handleNotificationSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/notification-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notificationSettings),
      });

      if (response.ok) {
        setShowNotificationsModal(false);
        alert('Notification settings updated');
      }
    } catch (error) {
      console.error('Notification settings error:', error);
    }
  };

  // Touch event handlers for mobile photo editor
  const getDistance = (touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touches = e.touches;
    
    if (touches.length === 1) {
      // Single touch - start dragging
      setIsDragging(true);
      setLastTouch({ x: touches[0].clientX, y: touches[0].clientY });
    } else if (touches.length === 2) {
      // Two touches - start pinch zoom
      setTouchStartDistance(getDistance(touches[0] as Touch, touches[1] as Touch));
      setLastScale(cropData.scale);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touches = e.touches;
    
    if (touches.length === 1 && isDragging) {
      // Single touch - dragging
      const touch = touches[0];
      const deltaX = touch.clientX - lastTouch.x;
      const deltaY = touch.clientY - lastTouch.y;
      
      setCropData(prev => ({
        ...prev,
        x: Math.max(-100, Math.min(100, prev.x + deltaX)),
        y: Math.max(-100, Math.min(100, prev.y + deltaY))
      }));
      
      setLastTouch({ x: touch.clientX, y: touch.clientY });
    } else if (touches.length === 2) {
      // Two touches - pinch zoom
      const distance = getDistance(touches[0] as Touch, touches[1] as Touch);
      const scale = (distance / touchStartDistance) * lastScale;
      
      // Calculate minimum scale to fill circle
      const circleSize = 256;
      const minScale = Math.max(circleSize / imageDimensions.width, circleSize / imageDimensions.height);
      
      setCropData(prev => ({
        ...prev,
        scale: Math.max(minScale, Math.min(3, scale))
      }));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      if (response.ok) {
        const data = await response.json();
        setFailedAttempts(0); // Reset on success
        // The AuthContext will handle the user state update
        router.refresh();
      } else {
        const errorData = await response.json();
        setLoginError(errorData.error || errorData.message || "Inloggen mislukt");
        setFailedAttempts(prev => prev + 1);
      }
    } catch (error) {
      setLoginError("Er is een fout opgetreden bij het inloggen");
      setFailedAttempts(prev => prev + 1);
    } finally {
      setLoginLoading(false);
    }
  };

  // No automatic redirect - let users stay on account page
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="bubble-grid">
        <div className="bubble col-span-full text-center">
          <div className="text-gray-500">{t.loading}</div>
        </div>
      </div>
    );
  }

  // Show login form for non-logged-in users
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.account}</h1>
            <p className="text-gray-600">{t.manageAccountSettings}</p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">🔒</div>
              <h2 className="text-xl font-semibold mb-2">{t.login}</h2>
              <p className="text-gray-600 text-sm">
                {t.loginToAccess}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.email}
                </label>
                <input
                  type="email"
                  id="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder={t.enterEmailAddress}
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.password}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder={t.enterPassword}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    )}
                  </button>
                </div>
                <div className="mt-3 text-right">
                  <a 
                    href="/forgot-password" 
                    style={{ 
                      color: '#ea580c',
                      fontSize: '14px',
                      fontWeight: '600',
                      textDecoration: 'none',
                      display: 'inline-block'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                  >
                    🔑 Wachtwoord vergeten?
                  </a>
                </div>
              </div>

              {loginError && (
                <div className="text-red-600 text-sm text-center">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 px-6 text-white rounded-xl font-medium transition-all duration-200"
                style={{ backgroundColor: '#ff6b35' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e55a2b'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff6b35'}
              >
                {loginLoading ? "Inloggen..." : t.login}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Nog geen account?{" "}
                <Link 
                  href="/register" 
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  Registreren
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Business Account Layout - Two column with sidebar tabs
  if (isBusiness) {
  return (
      <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">{t.account}</h1>
        
        {/* Profile Image */}
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg mx-auto relative group">
            {userProfile.avatar ? (
              <NextImage
                src={userProfile.avatar}
                alt="Profile"
                fill
                  sizes="96px"
                className="object-cover"
                unoptimized
                priority
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            )}
          </div>
          
            {/* Edit Icon Overlay */}
          <div 
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-all duration-200 hover:scale-110"
            style={{ backgroundColor: '#ff6b35' }}
            onClick={() => fileInputRef.current?.click()}
          >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
          
          {uploadingPhoto && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
            {userProfile.firstName} {userProfile.lastName}
          </h2>
            <p className="text-gray-600">{userProfile.email}</p>
            {company && (
              <p className="text-sm text-orange-600 mt-1">{company.company_name || company.name}</p>
            )}
        </div>
      </div>

        {/* Two Column Layout */}
        <div className="flex gap-6">
          {/* Left Sidebar - Tabs */}
          <div className="w-56 flex-shrink-0">
            <nav className="space-y-2">
              {/* Edit Details Tab */}
              <button
                onClick={() => setActiveTab('edit-details')}
                className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                  activeTab === 'edit-details'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="mr-3 flex-shrink-0">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <span className="text-sm font-medium">{t.editDetails}</span>
              </button>

              {/* Language Tab */}
              <button
                onClick={() => setActiveTab('language')}
                className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                  activeTab === 'language'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="mr-3 flex-shrink-0">
                  <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
                </svg>
                <span className="text-sm font-medium">{t.language}</span>
              </button>

              {/* Employees Tab */}
              <button
                onClick={() => setActiveTab('employees')}
                className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                  activeTab === 'employees'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="mr-3 flex-shrink-0">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
                <span className="text-sm font-medium">{t.employees}</span>
              </button>

              {/* Logout Tab */}
              <button
                onClick={logout}
                className="w-full flex items-center px-4 py-3 rounded-lg text-left transition-all duration-200 bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="mr-3 flex-shrink-0">
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                </svg>
                <span className="text-sm font-medium">{t.logout}</span>
              </button>
            </nav>
              </div>

          {/* Right Content Area */}
          <div className="flex-1 min-w-0">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              {/* Edit Details Content */}
              {activeTab === 'edit-details' && (
                <div>
                  <h3 className="text-xl font-semibold mb-6">{t.editDetails}</h3>
                  <form onSubmit={handleEditProfile} className="space-y-6">
                    {/* Personal Information */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">{t.personalData}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">{t.firstName}</label>
                          <input
                            type="text"
                            value={editFormData.firstName}
                            onChange={(e) => setEditFormData({...editFormData, firstName: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">{t.lastName}</label>
                          <input
                            type="text"
                            value={editFormData.lastName}
                            onChange={(e) => setEditFormData({...editFormData, lastName: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">{t.email}</label>
                          <input
                            type="email"
                            value={editFormData.email}
                            onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">{t.phone}</label>
                          <input
                            type="tel"
                            value={editFormData.phone}
                            onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
            </div>
          </div>

                    {/* Address */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">{t.address}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">{t.country}</label>
                          <select
                            value={editFormData.country}
                            onChange={(e) => setEditFormData({...editFormData, country: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="">{t.selectCountry}</option>
                            <option value="NL">{t.netherlands}</option>
                            <option value="BE">{t.belgium}</option>
                            <option value="DE">{t.germany}</option>
                            <option value="FR">{t.france}</option>
                          </select>
              </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">{t.postalCode}</label>
                          <input
                            type="text"
                            value={editFormData.postalCode}
                            onChange={(e) => handlePostalCodeChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="1234AB"
                          />
            </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">{t.street}</label>
                          <input
                            type="text"
                            value={editFormData.street}
                            onChange={(e) => setEditFormData({...editFormData, street: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">{t.city}</label>
                          <input
                            type="text"
                            value={editFormData.city}
                            onChange={(e) => setEditFormData({...editFormData, city: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
          </div>
        </div>
      </div>

                    {/* Password Change Section */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">{t.changePassword}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">{t.currentPassword}</label>
                          <div className="relative">
                            <input
                              type={showCurrentPassword ? "text" : "password"}
                              value={passwordFormData.currentPassword}
                              onChange={(e) => setPasswordFormData({...passwordFormData, currentPassword: e.target.value})}
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                {showCurrentPassword ? (
                                  <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                                ) : (
                                  <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                                )}
                  </svg>
                            </button>
                          </div>
                </div>
                <div>
                          <label className="block text-sm font-medium mb-1">{t.newPassword}</label>
                          <div className="relative">
                            <input
                              type={showNewPassword ? "text" : "password"}
                              value={passwordFormData.newPassword}
                              onChange={(e) => setPasswordFormData({...passwordFormData, newPassword: e.target.value})}
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                {showNewPassword ? (
                                  <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                                ) : (
                                  <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                                )}
                              </svg>
                            </button>
                </div>
              </div>
                <div>
                          <label className="block text-sm font-medium mb-1">{t.confirmPasswordField}</label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              value={passwordFormData.confirmPassword}
                              onChange={(e) => setPasswordFormData({...passwordFormData, confirmPassword: e.target.value})}
                              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                {showConfirmPassword ? (
                                  <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                                ) : (
                                  <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                                )}
                              </svg>
                            </button>
                    </div>
                  </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{t.leaveEmptyPassword}</p>
                </div>
                
                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        className="px-6 py-2 text-white rounded-lg font-medium transition-colors"
                        style={{ backgroundColor: '#ff6b35' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e55a2b'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff6b35'}
                      >
                        {t.saveChangesBtn}
                      </button>
                  </div>
                  </form>
            </div>
          )}

              {/* Language Content */}
              {activeTab === 'language' && (
                <div>
                  <h3 className="text-xl font-semibold mb-6">{t.language}</h3>
                  <div className="space-y-3 max-w-md">
                    <button
                      onClick={() => setLanguage('nl')}
                      className={`w-full p-4 rounded-lg border-2 transition-colors ${
                        language === 'nl' 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
              <div className="flex items-center">
                        <span className="text-2xl mr-3">🇳🇱</span>
                        <div className="text-left">
                          <div className="font-medium">Nederlands</div>
                          <div className="text-sm text-gray-500">Dutch</div>
                        </div>
                        {language === 'nl' && (
                          <svg className="ml-auto w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                        )}
                </div>
                    </button>
                    <button
                      onClick={() => setLanguage('en')}
                      className={`w-full p-4 rounded-lg border-2 transition-colors ${
                        language === 'en' 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">🇬🇧</span>
                        <div className="text-left">
                          <div className="font-medium">English</div>
                          <div className="text-sm text-gray-500">English</div>
                </div>
                        {language === 'en' && (
                          <svg className="ml-auto w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                        )}
              </div>
                    </button>
                  </div>
                </div>
              )}
              
              {/* Employees Content */}
              {activeTab === 'employees' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">{t.employees}</h3>
              <button
                onClick={() => setShowAddEmployee(!showAddEmployee)}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
              >
                      + {t.addEmployee}
              </button>
            </div>

            {/* Add Employee Form */}
            {showAddEmployee && (
              <form onSubmit={handleAddEmployee} className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="mb-4">
                  <label htmlFor="employeeEmail" className="block text-sm font-medium text-gray-700 mb-2">
                          {t.email}
                  </label>
                  <input
                    type="email"
                    id="employeeEmail"
                    value={employeeEmail}
                    onChange={(e) => setEmployeeEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder={t.enterEmailAddress}
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddEmployee(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                          {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                          {t.addEmployee}
                  </button>
                </div>
              </form>
            )}

            {/* Error/Success Messages */}
            {businessError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                {businessError}
              </div>
            )}

            {businessSuccess && (
              <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg text-sm">
                {businessSuccess}
              </div>
            )}

            {/* Employee List */}
            <div>
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
                      {t.employees} ({employees.length})
                    </h4>
              {employees.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" className="mx-auto mb-4 text-gray-300">
                          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                        </svg>
                        <p>{t.noEmployeesYet}</p>
                        <p className="text-sm mt-1">{t.addEmployeesToCollaborate}</p>
                      </div>
              ) : (
                <div className="space-y-3">
                  {employees.map((employee) => (
                    <div key={employee.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                                <span className="text-sm font-medium text-gray-600">
                                  {employee.firstName?.[0]}{employee.lastName?.[0]}
                                </span>
                              </div>
                      <div>
                        <div className="font-medium text-gray-900">{employee.firstName} {employee.lastName}</div>
                        <div className="text-sm text-gray-600">{employee.email}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs px-2 py-1 rounded ${
                          employee.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {employee.status === 'accepted' ? 'Actief' : 'In afwachting'}
                              </span>
                      <button
                        onClick={() => handleRemoveEmployee(employee.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                      >
                        Verwijderen
                      </button>
                            </div>
                    </div>
                  ))}
                </div>
              )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Photo Editor Modal */}
        {showPhotoEditor && selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4 text-center">Profielfoto bewerken</h3>
              
              <div className="relative mb-6">
                <div 
                  className="w-64 h-64 mx-auto relative overflow-hidden rounded-full border-4 border-gray-300 touch-none"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <NextImage
                    src={selectedImage}
                    alt="Profile preview"
                    fill
                    unoptimized
                    draggable={false}
                    className="select-none transition-transform duration-75 ease-out object-cover"
                    style={{
                      transform: `scale(${cropData.scale}) translate(${cropData.x}px, ${cropData.y}px)`,
                      cursor: 'move',
                      touchAction: 'none',
                    }}
                  />
                  <div className="absolute inset-0 border-2 border-white rounded-full pointer-events-none"></div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Zoom</label>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={cropData.scale}
                    onChange={(e) => {
                      const newScale = parseFloat(e.target.value);
                      const circleSize = 256;
                      const minScale = Math.max(circleSize / imageDimensions.width, circleSize / imageDimensions.height);
                      setCropData(prev => ({ ...prev, scale: Math.max(minScale, newScale) }));
                    }}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPhotoEditor(false);
                    setSelectedImage(null);
                    setCropData({ x: 0, y: 0, scale: 1 });
                    setImageLoaded(false);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleSavePhoto}
                  disabled={uploadingPhoto}
                  className="flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50"
                  style={{ backgroundColor: '#ff6b35' }}
                >
                  {uploadingPhoto ? 'Opslaan...' : 'Opslaan'}
                </button>
            </div>
          </div>
        </div>
      )}
      </div>
    );
  }

  // Regular User Account Page - Professional layout
  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Profile Image */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 shadow-md relative">
              {userProfile.avatar ? (
                <NextImage
                  src={userProfile.avatar}
                  alt="Profile"
                  fill
                  sizes="96px"
                  className="object-cover"
                  unoptimized
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="#9ca3af">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
            </div>
            
            {/* Edit Photo Button */}
            <button 
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
              style={{ backgroundColor: '#ff6b35' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            
            {uploadingPhoto && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {userProfile.firstName} {userProfile.lastName}
            </h1>
            <p className="text-gray-600 mt-1">{userProfile.email}</p>
            <div className="mt-2">
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                {t.privateAccount}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Settings Section */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{t.settings}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Gegevens wijzigen */}
          <button 
            onClick={() => setShowEditModal(true)}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-orange-200 transition-all duration-200 text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#3b82f6">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 text-sm">{t.editDetails}</h3>
            <p className="text-xs text-gray-500 mt-1">{t.adjustProfile}</p>
          </button>

          {/* Taal wijzigen */}
          <button 
            onClick={() => setShowLanguageModal(true)}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-orange-200 transition-all duration-200 text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#22c55e">
                <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 text-sm">{t.language}</h3>
            <p className="text-xs text-gray-500 mt-1">{t.chooseLanguage}</p>
          </button>

          {/* Wachtwoord wijzigen */}
          <button 
            onClick={() => setShowPasswordModal(true)}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-orange-200 transition-all duration-200 text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#9333ea">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 text-sm">{t.password}</h3>
            <p className="text-xs text-gray-500 mt-1">{t.changePasswordShort}</p>
          </button>

          {/* Uitloggen */}
          <button 
            onClick={logout}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-red-200 transition-all duration-200 text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#ef4444">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 text-sm">{t.logout}</h3>
            <p className="text-xs text-gray-500 mt-1">{t.logoutFromAccount}</p>
          </button>
        </div>
      </section>

      {/* Account Info Card */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-800 mb-4">{t.accountInfo}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#6b7280">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <div>
              <div className="text-xs text-gray-500">{t.name}</div>
              <div className="font-medium text-gray-900">{userProfile.firstName} {userProfile.lastName}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#6b7280">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </div>
            <div>
              <div className="text-xs text-gray-500">{t.email}</div>
              <div className="font-medium text-gray-900 text-sm truncate">{userProfile.email}</div>
            </div>
          </div>
          {userProfile.phone && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#6b7280">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
              </div>
              <div>
                <div className="text-xs text-gray-500">{t.phone}</div>
                <div className="font-medium text-gray-900">{userProfile.phone}</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Edit Profile Modal - Professional Style */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-100 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="bg-white rounded-t-2xl border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#3b82f6">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{t.editDetails}</h2>
                    <p className="text-sm text-gray-500">{t.updatePersonalInfo}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#6b7280">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              <form onSubmit={handleEditProfile} className="space-y-6">
                {/* Personal Info Section */}
                <section className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">{t.personalData}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t.firstName}</label>
                  <input
                    type="text"
                    value={editFormData.firstName}
                    onChange={(e) => setEditFormData({...editFormData, firstName: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        placeholder={t.firstName}
                  />
                </div>
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t.lastName}</label>
                  <input
                    type="text"
                    value={editFormData.lastName}
                    onChange={(e) => setEditFormData({...editFormData, lastName: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        placeholder={t.lastName}
                  />
              </div>
              <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t.email}</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        placeholder={t.exampleEmail}
                />
              </div>
              <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t.phone}</label>
                <input
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        placeholder={t.examplePhone}
                />
              </div>
              </div>
                </section>
              
                {/* Address Section */}
                <section className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">{t.addressData}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t.country}</label>
                    <select
                      value={editFormData.country}
                      onChange={(e) => setEditFormData({...editFormData, country: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    >
                        <option value="">{t.selectCountry}</option>
                        <option value="NL">{t.netherlands}</option>
                        <option value="BE">{t.belgium}</option>
                        <option value="DE">{t.germany}</option>
                        <option value="FR">{t.france}</option>
                    </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t.postalCode}</label>
                    <input
                      type="text"
                      value={editFormData.postalCode}
                      onChange={(e) => handlePostalCodeChange(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        placeholder={t.examplePostalCode}
                    />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t.street}</label>
                    <input
                      type="text"
                      value={editFormData.street}
                      onChange={(e) => setEditFormData({...editFormData, street: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        placeholder={t.exampleStreet}
                    />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t.city}</label>
                    <input
                      type="text"
                      value={editFormData.city}
                      onChange={(e) => setEditFormData({...editFormData, city: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        placeholder={t.exampleCity}
                    />
                  </div>
                </div>
                </section>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                    className="flex-1 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                    className="flex-1 px-6 py-3 text-white rounded-xl font-medium transition-colors shadow-lg"
                  style={{ backgroundColor: '#ff6b35' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e55a2b'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff6b35'}
                >
                    Wijzigingen opslaan
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Language Selection Modal - Professional Style with Search */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-100 rounded-2xl w-full max-w-md shadow-2xl max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-white rounded-t-2xl border-b border-gray-200 p-6 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#22c55e">
                      <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{t.language}</h2>
                    <p className="text-sm text-gray-500">{availableLanguages.length} {t.availableLanguages}</p>
                  </div>
                </div>
              <button
                onClick={() => {
                  setShowLanguageModal(false);
                    setLanguageSearch("");
                }}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#6b7280">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                  </svg>
                </button>
                  </div>
                </div>

            {/* Search Bar */}
            <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={languageSearch}
                  onChange={(e) => setLanguageSearch(e.target.value)}
                  placeholder={t.searchLanguage}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  autoFocus
                />
                {languageSearch && (
                  <button
                    onClick={() => setLanguageSearch("")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                    </svg>
              </button>
                )}
              </div>
            </div>

            {/* Current Language */}
            {!languageSearch && (
              <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.currentLanguage}</p>
                {(() => {
                  const currentLang = availableLanguages.find(l => l.code === language);
                  return currentLang ? (
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-200">
                      <span className="text-2xl">{currentLang.flag}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{currentLang.nativeName}</div>
                        <div className="text-sm text-gray-500">{currentLang.name}</div>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                        </svg>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            {/* Language List */}
            <div className="p-4 overflow-y-auto flex-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {languageSearch ? t.searchResults : t.allLanguages}
              </p>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {availableLanguages
                  .filter(lang => {
                    if (!languageSearch) return true;
                    const search = languageSearch.toLowerCase();
                    return (
                      lang.name.toLowerCase().includes(search) ||
                      lang.nativeName.toLowerCase().includes(search) ||
                      lang.code.toLowerCase().includes(search)
                    );
                  })
                  .map((lang, index, filteredArray) => (
              <button
                      key={lang.code}
                onClick={() => {
                        setLanguage(lang.code);
                  setShowLanguageModal(false);
                        setLanguageSearch("");
                }}
                      className={`w-full p-4 flex items-center gap-4 transition-colors ${
                        index < filteredArray.length - 1 ? 'border-b border-gray-100' : ''
                      } ${language === lang.code ? 'bg-orange-50' : 'hover:bg-gray-50'}`}
              >
                      <span className="text-2xl">{lang.flag}</span>
                      <div className="text-left flex-1">
                        <div className="font-medium text-gray-900">{lang.nativeName}</div>
                        <div className="text-sm text-gray-500">{lang.name}</div>
                  </div>
                      {language === lang.code && (
                        <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                          </svg>
                </div>
                      )}
              </button>
                  ))}
                {availableLanguages.filter(lang => {
                  if (!languageSearch) return true;
                  const search = languageSearch.toLowerCase();
                  return (
                    lang.name.toLowerCase().includes(search) ||
                    lang.nativeName.toLowerCase().includes(search) ||
                    lang.code.toLowerCase().includes(search)
                  );
                }).length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>{t.noLanguagesFound} &ldquo;{languageSearch}&rdquo;</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal - Professional Style */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-100 rounded-2xl w-full max-w-md shadow-2xl">
            {/* Modal Header */}
            <div className="bg-white rounded-t-2xl border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#9333ea">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{t.changePassword}</h2>
                    <p className="text-sm text-gray-500">{t.chooseStrongPassword}</p>
                  </div>
            </div>
            <button
                  onClick={() => setShowPasswordModal(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#6b7280">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
                  </svg>
            </button>
          </div>
        </div>

            {/* Modal Content */}
            <div className="p-6">
              <form onSubmit={handleChangePassword} className="space-y-6">
                <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Huidig wachtwoord</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordFormData.currentPassword}
                    onChange={(e) => setPasswordFormData({...passwordFormData, currentPassword: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all pr-12"
                    required
                        placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showCurrentPassword ? (
                            <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                    ) : (
                            <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                    )}
                        </svg>
                  </button>
                </div>
              </div>

              <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nieuw wachtwoord</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordFormData.newPassword}
                    onChange={(e) => setPasswordFormData({...passwordFormData, newPassword: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all pr-12"
                    required
                        placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showNewPassword ? (
                            <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                    ) : (
                            <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                    )}
                        </svg>
                  </button>
                </div>
              </div>

              <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bevestig nieuw wachtwoord</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordFormData.confirmPassword}
                    onChange={(e) => setPasswordFormData({...passwordFormData, confirmPassword: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all pr-12"
                    required
                        placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showConfirmPassword ? (
                            <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                    ) : (
                            <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                    )}
                        </svg>
                  </button>
                </div>
              </div>
                </section>

                {/* Action Buttons */}
                <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                    className="flex-1 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                    className="flex-1 px-6 py-3 text-white rounded-xl font-medium transition-colors shadow-lg"
                  style={{ backgroundColor: '#ff6b35' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e55a2b'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff6b35'}
                >
                  Wachtwoord wijzigen
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal - Mobile only */}
      {showNotificationsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Notificatie-instellingen</h3>
            <form onSubmit={handleNotificationSettings} className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Push notificaties</div>
                    <div className="text-sm text-gray-500">Ontvang meldingen op uw apparaat</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.pushNotifications}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        pushNotifications: e.target.checked
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">E-mail notificaties</div>
                    <div className="text-sm text-gray-500">Ontvang updates via e-mail</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailNotifications}
                      onChange={(e) => setNotificationSettings(prev => ({
                        ...prev,
                        emailNotifications: e.target.checked
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNotificationsModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white rounded-lg"
                  style={{ backgroundColor: '#ff6b35' }}
                >
                  Opslaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Photo Editor Modal */}
      {showPhotoEditor && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4 text-center">Profielfoto bewerken</h3>
            
            <div className="relative mb-6">
              <div 
                className="w-64 h-64 mx-auto relative overflow-hidden rounded-full border-4 border-gray-300 touch-none"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <NextImage
                  src={selectedImage}
                  alt="Profile preview"
                  fill
                  unoptimized
                  draggable={false}
                  className="select-none transition-transform duration-75 ease-out object-cover"
                  style={{
                    transform: `scale(${cropData.scale}) translate(${cropData.x}px, ${cropData.y}px)`,
                    cursor: 'move',
                    touchAction: 'none',
                  }}
                />
                <div className="absolute inset-0 border-2 border-white rounded-full pointer-events-none"></div>
              </div>
              <div className="text-center mt-2 text-sm text-gray-500">
                <div className="lg:hidden">📱 Sleep om te verplaatsen, knijp om te zoomen</div>
                <div className="hidden lg:block">Gebruik de schuifregelaars hieronder</div>
              </div>
            </div>

            {/* Desktop controls - hidden on mobile */}
            <div className="space-y-4 hidden lg:block">
              <div>
                <label className="block text-sm font-medium mb-2">Zoom</label>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={cropData.scale}
                  onChange={(e) => {
                    const newScale = parseFloat(e.target.value);
                    const circleSize = 256;
                    const minScale = Math.max(circleSize / imageDimensions.width, circleSize / imageDimensions.height);
                    setCropData(prev => ({ ...prev, scale: Math.max(minScale, newScale) }));
                  }}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 text-center mt-1">
                  {Math.round(cropData.scale * 100)}%
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Horizontaal</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={cropData.x}
                    onChange={(e) => setCropData(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Verticaal</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={cropData.y}
                    onChange={(e) => setCropData(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowPhotoEditor(false);
                  setSelectedImage(null);
                  setCropData({ x: 0, y: 0, scale: 1 });
                  setImageLoaded(false);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuleren
              </button>
              <button
                onClick={handleSavePhoto}
                disabled={uploadingPhoto}
                className="flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50"
                style={{ backgroundColor: '#ff6b35' }}
              >
                {uploadingPhoto ? 'Opslaan...' : 'Opslaan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}