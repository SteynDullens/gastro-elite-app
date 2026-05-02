import type { Metadata } from "next";
import SimpleFloatingNav from "@/components/SimpleFloatingNav";
import DesktopSidebar from "@/components/DesktopSidebar";
import AdminNotifications from "@/components/AdminNotifications";
import { RecipeProvider } from "@/context/RecipeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { AppLockProvider } from "@/context/AppLockContext";
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
};

/** Fresh HTML on every request so CDN/browser never serves an old shell pointing at deleted chunk files after deploy. */
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
        <html lang="en">
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta name="format-detection" content="telephone=no" />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />
            <meta name="theme-color" content="#A0A0A0" />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  (function() {
                    if (!('serviceWorker' in navigator)) return;
                    navigator.serviceWorker.getRegistrations().then(function(regs) {
                      return Promise.all(regs.map(function(r) { return r.unregister(); }));
                    }).then(function() {
                      if (navigator.serviceWorker.controller) {
                        console.log('Gastro-Elite: removed legacy service worker(s) to avoid stale JS after deploy.');
                      }
                    }).catch(function() {});
                  })();
                `,
              }}
            />
          </head>
      <body className={`${roboto.variable} font-sans antialiased`}>
        <div className="min-h-screen" style={{ backgroundColor: '#A0A0A0' }}>
          <AuthProvider>
            <LanguageProvider>
              <AppLockProvider>
              <RecipeProvider>
                {/* Admin Notifications Bell */}
                <AdminNotifications />
                
                <div className="flex">
                  {/* Desktop Sidebar */}
                  <DesktopSidebar />
                  
                  {/* Main content area */}
                  <main className="main-content flex-1">
                    <div className="max-w-7xl mx-auto p-4 lg:p-8 animate-app-enter">
                      {children}
                    </div>
                  </main>
                </div>
                
                {/* Mobile Navigation */}
                <SimpleFloatingNav />
              </RecipeProvider>
              </AppLockProvider>
            </LanguageProvider>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
