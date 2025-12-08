import { NextRequest, NextResponse } from 'next/server';

// Dutch address lookup API
// This uses a free service - you can replace with PostcodeAPI.nu or another service if needed
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postalCode = searchParams.get('postalCode');
    const houseNumber = searchParams.get('houseNumber');

    if (!postalCode || !houseNumber) {
      return NextResponse.json(
        { error: 'Postcode en huisnummer zijn verplicht' },
        { status: 400 }
      );
    }

    // Clean postal code (remove spaces, make uppercase)
    const cleanPostalCode = postalCode.replace(/\s+/g, '').toUpperCase();
    
    // Validate Dutch postal code format (1234AB)
    if (!/^\d{4}[A-Z]{2}$/.test(cleanPostalCode)) {
      return NextResponse.json(
        { error: 'Ongeldig postcode formaat. Gebruik formaat: 1234AB' },
        { status: 400 }
      );
    }

    // Use PDOK (Publieke Dienstverlening Op de Kaart) API - free Dutch government service
    // Alternative: You can use PostcodeAPI.nu with an API key for more reliable results
    try {
      const pdokUrl = `https://api.pdok.nl/bzk/locatieserver/search/v3_1/lookup?fq=type:adres&fq=postcode:${cleanPostalCode}&fq=huisnummer:${houseNumber}&fl=weergavenaam,straatnaam,woonplaatsnaam,postcode,huisnummer`;
      
      const response = await fetch(pdokUrl, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Address lookup failed');
      }

      const data = await response.json();
      
      console.log('PDOK API response:', JSON.stringify(data, null, 2));
      
      if (data.response && data.response.docs && data.response.docs.length > 0) {
        const address = data.response.docs[0];
        console.log('Address data:', address);
        
        const street = address.straatnaam || address.weergavenaam?.split(',')[0] || '';
        const city = address.woonplaatsnaam || '';
        
        console.log('Extracted:', { street, city });
        
        return NextResponse.json({
          success: true,
          street: street,
          city: city,
          postalCode: address.postcode || cleanPostalCode,
          houseNumber: address.huisnummer || houseNumber
        });
      }

      // If PDOK doesn't return results, return empty (user can fill manually)
      return NextResponse.json({
        success: false,
        message: 'Adres niet gevonden. Vul handmatig in.'
      });

    } catch (apiError) {
      console.error('Address API error:', apiError);
      // Return empty response so user can fill manually
      return NextResponse.json({
        success: false,
        message: 'Adres lookup niet beschikbaar. Vul handmatig in.'
      });
    }

  } catch (error: any) {
    console.error('Address lookup error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het opzoeken van het adres' },
      { status: 500 }
    );
  }
}

