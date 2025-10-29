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
        <title>Gastro-Elite Mobile</title>
        <meta name="description" content="Mobile startup page for Gastro-Elite" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="16x16" />
        <link rel="icon" href="/favicon.svg" />
        <style dangerouslySetInnerHTML={{
          __html: `
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: system-ui, -apple-system, sans-serif;
              overflow: hidden;
            }
            html, body {
              height: 100%;
              width: 100%;
            }
          `
        }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}