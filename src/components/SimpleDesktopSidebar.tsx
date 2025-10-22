import Link from "next/link";

export default function SimpleDesktopSidebar() {
  return (
    <div 
      style={{ 
        position: 'fixed',
        left: '0',
        top: '0',
        width: '256px',
        height: '100vh',
        backgroundColor: '#333333',
        color: 'white',
        zIndex: 99999,
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        display: 'block',
        visibility: 'visible',
        opacity: 1
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <img src="/logo.svg" alt="Logo" style={{ width: '100%', maxWidth: '200px', height: 'auto' }} />
      </div>
      
      <nav>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li style={{ margin: '10px 0' }}>
            <Link href="/" style={{ 
              color: 'white', 
              textDecoration: 'none', 
              display: 'flex', 
              alignItems: 'center', 
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#ff6b35'
            }}>
              <span style={{ marginLeft: '10px' }}>Home</span>
            </Link>
          </li>
          <li style={{ margin: '10px 0' }}>
            <Link href="/recipes" style={{ 
              color: '#ccc', 
              textDecoration: 'none', 
              display: 'flex', 
              alignItems: 'center', 
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'transparent'
            }}>
              <span style={{ marginLeft: '10px' }}>Recepturen</span>
            </Link>
          </li>
          <li style={{ margin: '10px 0' }}>
            <a href="/add" style={{ 
              color: '#ccc', 
              textDecoration: 'none', 
              display: 'flex', 
              alignItems: 'center', 
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'transparent'
            }}>
              <span style={{ marginLeft: '10px' }}>Toevoegen</span>
            </a>
          </li>
          <li style={{ margin: '10px 0' }}>
            <a href="/account" style={{ 
              color: '#ccc', 
              textDecoration: 'none', 
              display: 'flex', 
              alignItems: 'center', 
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'transparent'
            }}>
              <span style={{ marginLeft: '10px' }}>Account</span>
            </a>
          </li>
        </ul>
      </nav>
      
      <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', textAlign: 'center', fontSize: '12px', color: '#999' }}>
        <p>© 2024 Gastro-Elite</p>
        <p>Professioneel receptenbeheer</p>
      </div>
    </div>
  );
}
