"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const { t, language, setLanguage } = useLanguage();
  const { user, logout, loading, isBusiness } = useAuth();
  const router = useRouter();
  
  // All useState hooks must be declared at the top, before any conditional logic
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userProfile, setUserProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    avatar: null,
  });
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  
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
  }, [user, isBusiness]);

  // Fetch company data
  const fetchCompanyData = async () => {
    if (!user?.companyId) return;
    
    try {
      const [companyResponse, employeesResponse] = await Promise.all([
        fetch(`/api/company/${user.companyId}`),
        fetch(`/api/company/${user.companyId}/employees`)
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
  };

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
      const img = new Image();
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
      const img = new Image();
      
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
        // The AuthContext will handle the user state update
        router.refresh();
      } else {
        const errorData = await response.json();
        setLoginError(errorData.message || "Inloggen mislukt");
      }
    } catch (error) {
      setLoginError("Er is een fout opgetreden bij het inloggen");
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
            <p className="text-gray-600">Beheer uw account en instellingen</p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">🔒</div>
              <h2 className="text-xl font-semibold mb-2">Inloggen</h2>
              <p className="text-gray-600 text-sm">
                Log in om uw accountinformatie en instellingen te bekijken.
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
                  placeholder="Voer uw e-mailadres in"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Wachtwoord
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Voer uw wachtwoord in"
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

  // Main Account Page - Single unified layout
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">{t.account}</h1>
        
        {/* Profile Image */}
        <div className="relative inline-block mb-6">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg mx-auto relative group">
            {userProfile.avatar ? (
              <img 
                src={userProfile.avatar} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            )}
          </div>
          
          {/* Edit Icon Overlay - Small circular bubble */}
          <div 
            className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-all duration-200 hover:scale-110"
            style={{ backgroundColor: '#ff6b35' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
          
          {/* Upload loading indicator */}
          {uploadingPhoto && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* User Information */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {userProfile.firstName} {userProfile.lastName}
          </h2>
          <p className="text-gray-600 text-lg">{userProfile.email}</p>
        </div>
      </div>

      {/* Action Buttons Grid */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {/* Gegevens wijzigen */}
          <div 
            className="bubble cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg h-20 flex items-center"
            style={{ backgroundColor: '#D9D9D9', color: '#333' }}
            onClick={() => setShowEditModal(true)}
          >
            <div className="bubble-content flex items-center w-full">
              <div className="bubble-icon mr-4 flex-shrink-0 flex items-center justify-center" style={{ color: '#FF8C00' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div className="bubble-title text-left flex-1">Gegevens wijzigen</div>
            </div>
          </div>


          {/* Taal wijzigen */}
          <div 
            className="bubble cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg h-20 flex items-center"
            style={{ backgroundColor: '#D9D9D9', color: '#333' }}
            onClick={() => setShowLanguageModal(true)}
          >
            <div className="bubble-content flex items-center w-full">
              <div className="bubble-icon mr-4 flex-shrink-0 flex items-center justify-center" style={{ color: '#FF8C00' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
                </svg>
              </div>
              <div className="bubble-title text-left flex-1">Taal wijzigen</div>
            </div>
          </div>

          {/* Wachtwoord wijzigen */}
          <div 
            className="bubble cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg h-20 flex items-center"
            style={{ backgroundColor: '#D9D9D9', color: '#333' }}
            onClick={() => setShowPasswordModal(true)}
          >
            <div className="bubble-content flex items-center w-full">
              <div className="bubble-icon mr-4 flex-shrink-0 flex items-center justify-center" style={{ color: '#FF8C00' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
              </div>
              <div className="bubble-title text-left flex-1">Wachtwoord wijzigen</div>
            </div>
          </div>

          {/* Notificaties - Mobile only */}
          <div 
            className="bubble cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg h-20 flex items-center lg:hidden"
            style={{ backgroundColor: '#D9D9D9', color: '#333' }}
            onClick={() => setShowNotificationsModal(true)}
          >
            <div className="bubble-content flex items-center w-full">
              <div className="bubble-icon mr-4 flex-shrink-0 flex items-center justify-center" style={{ color: '#FF8C00' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                </svg>
              </div>
              <div className="bubble-title text-left flex-1">Notificaties</div>
            </div>
          </div>

          {/* Uitloggen */}
          <div 
            className="bubble cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg h-20 flex items-center"
            style={{ backgroundColor: '#D9D9D9', color: '#333' }}
            onClick={logout}
          >
            <div className="bubble-content flex items-center w-full">
              <div className="bubble-icon mr-4 flex-shrink-0 flex items-center justify-center" style={{ color: '#FF8C00' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                </svg>
              </div>
              <div className="bubble-title text-left flex-1">Uitloggen</div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Information Section - Only for business users */}
      {isBusiness && (
        <div className="max-w-4xl mx-auto mb-12">
          {/* Company Information */}
          {company && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mr-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-orange-600">
                    <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Bedrijfsinformatie</h2>
                  <p className="text-gray-600">Beheer uw bedrijfsgegevens en medewerkers</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Bedrijfsgegevens</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Bedrijfsnaam:</strong> {company.company_name}</div>
                    <div><strong>KvK Nummer:</strong> {company.kvk_number}</div>
                    <div><strong>Status:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                        company.status === 'approved' ? 'bg-green-100 text-green-800' :
                        company.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {company.status?.toUpperCase()}
                      </span>
                    </div>
                    <div><strong>Contact:</strong> {company.contact_name}</div>
                    <div><strong>Telefoon:</strong> {company.contact_phone}</div>
                    <div><strong>E-mail:</strong> {company.contact_email}</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Bedrijfsadres</h3>
                  <div className="text-sm text-gray-600">
                    {company.address}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Employee Management */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-blue-600">
                    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H16c-.8 0-1.54.37-2.01.99L12 11l-1.99-2.01A2.5 2.5 0 0 0 8 8H5.46a1.5 1.5 0 0 0-1.42 1.37L1.5 16H4v6h2v-6h2.5l2.54 7.63A1.5 1.5 0 0 0 12.54 20H16c.8 0 1.54-.37 2.01-.99L20 17l1.99 2.01A2.5 2.5 0 0 0 24 20h-2v6h-2z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Medewerkerbeheer</h2>
                  <p className="text-gray-600">Beheer uw teamleden en uitnodigingen</p>
                </div>
              </div>
              
              <button
                onClick={() => setShowAddEmployee(!showAddEmployee)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Medewerker toevoegen
              </button>
            </div>

            {/* Add Employee Form */}
            {showAddEmployee && (
              <form onSubmit={handleAddEmployee} className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="mb-4">
                  <label htmlFor="employeeEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    E-mailadres medewerker
                  </label>
                  <input
                    type="email"
                    id="employeeEmail"
                    value={employeeEmail}
                    onChange={(e) => setEmployeeEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="voer e-mailadres in"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddEmployee(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Uitnodiging verzenden
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
              <h3 className="font-medium text-gray-900 mb-3">Huidige medewerkers ({employees.length})</h3>
              {employees.length === 0 ? (
                <div className="text-gray-500 text-sm py-4">Nog geen medewerkers</div>
              ) : (
                <div className="space-y-3">
                  {employees.map((employee) => (
                    <div key={employee.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{employee.firstName} {employee.lastName}</div>
                        <div className="text-sm text-gray-600">{employee.email}</div>
                        <div className={`text-xs mt-1 px-2 py-1 rounded inline-block ${
                          employee.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {employee.status === 'accepted' ? 'Actief' : 'In afwachting'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveEmployee(employee.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                      >
                        Verwijderen
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Gegevens wijzigen</h3>
            <form onSubmit={handleEditProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Voornaam</label>
                  <input
                    type="text"
                    value={editFormData.firstName}
                    onChange={(e) => setEditFormData({...editFormData, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Achternaam</label>
                  <input
                    type="text"
                    value={editFormData.lastName}
                    onChange={(e) => setEditFormData({...editFormData, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">E-mail</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Telefoonnummer</label>
                <input
                  type="tel"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bedrijf</label>
                <input
                  type="text"
                  value={editFormData.company}
                  onChange={(e) => setEditFormData({...editFormData, company: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              {/* Address Fields */}
              <div className="border-t pt-4">
                <h4 className="text-lg font-medium mb-3">Adres</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Land</label>
                    <select
                      value={editFormData.country}
                      onChange={(e) => setEditFormData({...editFormData, country: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Selecteer land</option>
                      <option value="NL">Nederland</option>
                      <option value="BE">België</option>
                      <option value="DE">Duitsland</option>
                      <option value="FR">Frankrijk</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Postcode</label>
                    <input
                      type="text"
                      value={editFormData.postalCode}
                      onChange={(e) => handlePostalCodeChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="1234AB"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Straat</label>
                    <input
                      type="text"
                      value={editFormData.street}
                      onChange={(e) => setEditFormData({...editFormData, street: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Straatnaam 123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Plaats</label>
                    <input
                      type="text"
                      value={editFormData.city}
                      onChange={(e) => setEditFormData({...editFormData, city: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Stad"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
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

      {/* Language Selection Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-semibold mb-4">Taal wijzigen</h3>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setLanguage('nl');
                  setShowLanguageModal(false);
                }}
                className={`w-full p-3 rounded-lg border-2 transition-colors ${
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
                </div>
              </button>
              <button
                onClick={() => {
                  setLanguage('en');
                  setShowLanguageModal(false);
                }}
                className={`w-full p-3 rounded-lg border-2 transition-colors ${
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
                </div>
              </button>
            </div>
            <button
              onClick={() => setShowLanguageModal(false)}
              className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Sluiten
            </button>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Wachtwoord wijzigen</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Huidig wachtwoord</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordFormData.currentPassword}
                    onChange={(e) => setPasswordFormData({...passwordFormData, currentPassword: e.target.value})}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showCurrentPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nieuw wachtwoord</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordFormData.newPassword}
                    onChange={(e) => setPasswordFormData({...passwordFormData, newPassword: e.target.value})}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showNewPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bevestig nieuw wachtwoord</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordFormData.confirmPassword}
                    onChange={(e) => setPasswordFormData({...passwordFormData, confirmPassword: e.target.value})}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  >
                    {showConfirmPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white rounded-lg"
                  style={{ backgroundColor: '#ff6b35' }}
                >
                  Wachtwoord wijzigen
                </button>
              </div>
            </form>
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
                <img
                  src={selectedImage}
                  alt="Profile preview"
                  className="w-full h-full object-cover select-none transition-transform duration-75 ease-out"
                  style={{
                    transform: `scale(${cropData.scale}) translate(${cropData.x}px, ${cropData.y}px)`,
                    cursor: 'move',
                    touchAction: 'none',
                  }}
                  draggable={false}
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