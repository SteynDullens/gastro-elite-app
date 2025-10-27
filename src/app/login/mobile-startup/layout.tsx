export default function MobileStartupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#A0A0A0" />
        <title>Gastro-Elite</title>
        <meta name="description" content="Professioneel receptenbeheer voor de horeca" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="16x16" />
        <link rel="icon" href="/favicon.svg" />
      </head>
      <body className="font-sans antialiased">
        <div className="min-h-screen" style={{ backgroundColor: '#A0A0A0' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
