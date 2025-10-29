export default function MobileStartupPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center p-6">
      {/* Logo */}
      <div className="mb-8">
        <img 
          src="/logo.svg" 
          alt="Gastro-Elite Logo" 
          className="w-32 h-32 mx-auto"
        />
      </div>

      {/* Slogan */}
      <div className="text-center mb-12">
        <h2 className="text-lg font-medium text-gray-700 leading-relaxed max-w-sm">
          De slimme cockpit voor recepturen, HACCP en planning
        </h2>
      </div>

      {/* Login Section */}
      <div className="w-full max-w-sm space-y-6">
        {/* Primary Login Button */}
        <a
          href="/login"
          className="block w-full py-4 px-6 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg text-center"
          style={{ backgroundColor: '#ff6b35' }}
        >
          Inloggen
        </a>

        {/* Register Link */}
        <div className="text-center">
          <p className="text-gray-600 text-sm">
            Nog geen account?{" "}
            <a
              href="/register"
              className="text-orange-600 hover:text-orange-700 font-medium transition-colors underline"
            >
              Registreren
            </a>
          </p>
        </div>
      </div>

      {/* Bottom Navigation - Disabled State */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex justify-around items-center">
          <div className="flex flex-col items-center space-y-1 opacity-40">
            <div className="w-6 h-6 bg-gray-300 rounded"></div>
            <span className="text-xs text-gray-400">Home</span>
          </div>
          <div className="flex flex-col items-center space-y-1 opacity-40">
            <div className="w-6 h-6 bg-gray-300 rounded"></div>
            <span className="text-xs text-gray-400">Recepten</span>
          </div>
          <div className="flex flex-col items-center space-y-1 opacity-40">
            <div className="w-6 h-6 bg-gray-300 rounded"></div>
            <span className="text-xs text-gray-400">Toevoegen</span>
          </div>
          <div className="flex flex-col items-center space-y-1 opacity-40">
            <div className="w-6 h-6 bg-gray-300 rounded"></div>
            <span className="text-xs text-gray-400">Account</span>
          </div>
        </div>
      </div>
    </div>
  );
}
