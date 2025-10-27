export default function MobileLoginPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'white', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: '24px' 
    }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px', color: '#ff6b35' }}>
        Gastro-Elite
      </h1>
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '32px', textAlign: 'center', maxWidth: '300px' }}>
        De slimme cockpit voor recepturen, HACCP en planning
      </p>
      <button 
        style={{ 
          backgroundColor: '#ff6b35', 
          color: 'white', 
          padding: '16px 32px', 
          borderRadius: '12px', 
          border: 'none', 
          fontSize: '18px',
          cursor: 'pointer',
          marginBottom: '16px',
          width: '100%',
          maxWidth: '300px'
        }}
        onClick={() => window.location.href = '/login'}
      >
        Inloggen
      </button>
      <p style={{ fontSize: '16px', color: '#666' }}>
        Nog geen account? <a href="/register" style={{ color: '#ff6b35', textDecoration: 'underline' }}>Registreren</a>
      </p>
    </div>
  );
}
