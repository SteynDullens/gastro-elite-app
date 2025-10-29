"use client";

export default function MobilePage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#A0A0A0', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
          {/* Logo */}
          <div style={{ marginBottom: '32px' }}>
            <img 
              src="/logo.svg" 
              alt="Gastro-Elite Logo" 
              style={{ width: '128px', height: '128px', margin: '0 auto' }}
            />
          </div>

          {/* Slogan */}
          <div style={{ textAlign: 'center', marginBottom: '48px', maxWidth: '300px' }}>
            <h2 style={{ 
              fontSize: '18px', 
              fontWeight: '500', 
              color: '#374151', 
              lineHeight: '1.6',
              margin: 0
            }}>
              De slimme cockpit voor recepturen, HACCP en planning
            </h2>
          </div>

          {/* Login Section */}
          <div style={{ width: '100%', maxWidth: '300px' }}>
            {/* Primary Login Button */}
            <a
              href="/login"
              style={{
                display: 'block',
                width: '100%',
                padding: '16px 24px',
                backgroundColor: '#ff6b35',
                color: 'white',
                borderRadius: '12px',
                fontWeight: '500',
                textDecoration: 'none',
                textAlign: 'center',
                transition: 'all 0.2s',
                marginBottom: '24px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(255, 107, 53, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Inloggen
            </a>

            {/* Register Link */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ 
                color: '#6b7280', 
                fontSize: '14px', 
                margin: 0 
              }}>
                Nog geen account?{" "}
                <a
                  href="/register"
                  style={{
                    color: '#ff6b35',
                    fontWeight: '500',
                    textDecoration: 'underline'
                  }}
                >
                  Registreren
                </a>
              </p>
            </div>
          </div>

          {/* Bottom Navigation - Disabled State */}
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'white',
            borderTop: '1px solid #e5e7eb',
            padding: '16px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                opacity: 0.4
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: '#d1d5db',
                  borderRadius: '4px'
                }}></div>
                <span style={{
                  fontSize: '12px',
                  color: '#9ca3af'
                }}>Home</span>
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                opacity: 0.4
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: '#d1d5db',
                  borderRadius: '4px'
                }}></div>
                <span style={{
                  fontSize: '12px',
                  color: '#9ca3af'
                }}>Recepten</span>
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                opacity: 0.4
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: '#d1d5db',
                  borderRadius: '4px'
                }}></div>
                <span style={{
                  fontSize: '12px',
                  color: '#9ca3af'
                }}>Toevoegen</span>
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                opacity: 0.4
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  backgroundColor: '#d1d5db',
                  borderRadius: '4px'
                }}></div>
                <span style={{
                  fontSize: '12px',
                  color: '#9ca3af'
                }}>Account</span>
              </div>
            </div>
          </div>
    </div>
  );
}
