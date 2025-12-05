import type { Metadata } from "next";
import SimpleFloatingNav from "@/components/SimpleFloatingNav";
import DesktopSidebar from "@/components/DesktopSidebar";
import AdminNotifications from "@/components/AdminNotifications";
import { RecipeProvider } from "@/context/RecipeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "Gastro-Elite",
  description: "Professioneel receptenbeheer voor de horeca",
  icons: {
    icon: '/favicon.svg',
  },
  manifest: '/manifest.json',
  themeColor: '#A0A0A0',
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
        <html lang="en">
          <head>
            <meta name="format-detection" content="telephone=no" />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  if ('serviceWorker' in navigator) {
                    window.addEventListener('load', function() {
                      navigator.serviceWorker.register('/service-worker.js')
                        .then(function(registration) {
                          console.log('ServiceWorker registration successful with scope: ', registration.scope);
                        })
                        .catch(function(err) {
                          console.log('ServiceWorker registration failed: ', err);
                        });
                    });
                  }
                `,
              }}
            />
          </head>
      <body className={`${roboto.variable} font-sans antialiased`}>
        <div className="min-h-screen" style={{ backgroundColor: '#A0A0A0' }}>
          <AuthProvider>
            <LanguageProvider>
              <RecipeProvider>
                {/* Admin Notifications Bell */}
                <AdminNotifications />
                
                <div className="flex">
                  {/* Desktop Sidebar */}
                  <DesktopSidebar />
                  
                  {/* Main content area */}
                  <main className="main-content flex-1">
                    <div className="max-w-7xl mx-auto p-4 lg:p-8">
                      {children}
                    </div>
                  </main>
                </div>
                
                {/* Mobile Navigation */}
                <SimpleFloatingNav />
              </RecipeProvider>
            </LanguageProvider>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
