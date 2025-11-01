"use client";

import { useEffect } from 'react';
import Image from "next/image";

export default function MobileRedirectPage() {
  useEffect(() => {
    // Redirect to a working mobile page
    window.location.href = '/login';
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#A0A0A0',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      zIndex: 99999
    }}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <Image 
          src="/logo.svg" 
          alt="Gastro-Elite Logo" 
          width={128}
          height={128}
          priority
          style={{
            display: 'block',
            margin: '0 auto',
            maxWidth: '100%'
          }}
        />
      </div>
      
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

      <div style={{ width: '100%', maxWidth: '300px' }}>
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
        >
          Inloggen
        </a>
        
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
    </div>
  );
}

