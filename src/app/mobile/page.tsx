export default function MobilePage() {
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
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
        Mobile Startup Page
      </h1>
      <p style={{ fontSize: '16px', color: '#666', marginBottom: '32px', textAlign: 'center' }}>
        De slimme cockpit voor recepturen, HACCP en planning
      </p>
      <button 
        style={{ 
          backgroundColor: '#ff6b35', 
          color: 'white', 
          padding: '12px 24px', 
          borderRadius: '8px', 
          border: 'none', 
          fontSize: '16px',
          cursor: 'pointer',
          marginBottom: '16px'
        }}
        onClick={() => window.location.href = '/login'}
      >
        Inloggen
      </button>
      <p style={{ fontSize: '14px', color: '#666' }}>
        Nog geen account? <a href="/register" style={{ color: '#ff6b35' }}>Registreren</a>
      </p>
    </div>
  );
}
