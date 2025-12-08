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
    // Using suggest endpoint which is more reliable
    try {
      // First, try to find the address using suggest endpoint
      const suggestUrl = `https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest?q=${cleanPostalCode}+${houseNumber}&fq=type:adres&fl=weergavenaam,straatnaam,woonplaatsnaam,postcode,huisnummer`;
      
      const suggestResponse = await fetch(suggestUrl, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!suggestResponse.ok) {
        throw new Error('Address lookup failed');
      }

      const suggestData = await suggestResponse.json();
      
      console.log('PDOK Suggest API response:', JSON.stringify(suggestData, null, 2));
      
      if (suggestData.response && suggestData.response.docs && suggestData.response.docs.length > 0) {
        const address = suggestData.response.docs[0];
        console.log('Address data from suggest:', address);
        
        // Try multiple ways to extract street name
        let street = '';
        if (address.straatnaam) {
          street = address.straatnaam;
        } else if (address.weergavenaam) {
          // Parse weergavenaam format: "Straatnaam 123, 1234AB Plaatsnaam"
          const parts = address.weergavenaam.split(',');
          if (parts.length > 0) {
            // Remove house number and postal code from street name
            street = parts[0].trim().replace(/\s+\d+.*$/, '').trim();
          }
        }
        
        const city = address.woonplaatsnaam || '';
        
        // If we still don't have street, try to extract from weergavenaam differently
        if (!street && address.weergavenaam) {
          const weergaveParts = address.weergavenaam.split(',');
          if (weergaveParts.length >= 2) {
            // Street is usually before the first comma
            street = weergaveParts[0].replace(/\d+.*$/, '').trim();
          }
        }
        
        console.log('Extracted:', { street, city, weergavenaam: address.weergavenaam });
        
        if (street && city) {
          return NextResponse.json({
            success: true,
            street: street,
            city: city,
            postalCode: address.postcode || cleanPostalCode,
            houseNumber: address.huisnummer || houseNumber
          });
        }
      }

      // Fallback: Try lookup endpoint
      const lookupUrl = `https://api.pdok.nl/bzk/locatieserver/search/v3_1/lookup?fq=type:adres&fq=postcode:${cleanPostalCode}&fq=huisnummer:${houseNumber}&fl=weergavenaam,straatnaam,woonplaatsnaam,postcode,huisnummer`;
      
      const lookupResponse = await fetch(lookupUrl, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (lookupResponse.ok) {
        const lookupData = await lookupResponse.json();
        console.log('PDOK Lookup API response:', JSON.stringify(lookupData, null, 2));
        
        if (lookupData.response && lookupData.response.docs && lookupData.response.docs.length > 0) {
          const address = lookupData.response.docs[0];
          console.log('Address data from lookup:', address);
          
          let street = address.straatnaam || '';
          if (!street && address.weergavenaam) {
            const parts = address.weergavenaam.split(',');
            street = parts[0]?.replace(/\d+.*$/, '').trim() || '';
          }
          
          const city = address.woonplaatsnaam || '';
          
          console.log('Extracted from lookup:', { street, city });
          
          if (street && city) {
            return NextResponse.json({
              success: true,
              street: street,
              city: city,
              postalCode: address.postcode || cleanPostalCode,
              houseNumber: address.huisnummer || houseNumber
            });
          }
        }
      }

      // If PDOK doesn't return results, return empty (user can fill manually)
      console.log('No address found in PDOK API');
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

