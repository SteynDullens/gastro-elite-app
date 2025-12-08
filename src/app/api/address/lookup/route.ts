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
    try {
      // Use free PostcodeAPI.nu service as primary (more reliable)
      // Fallback to PDOK if needed
      try {
        const postcodeApiUrl = `https://postcode-api.nu/api/v1/postcode/${cleanPostalCode}/${houseNumber}`;
        const postcodeResponse = await fetch(postcodeApiUrl, {
          headers: {
            'Accept': 'application/json'
          }
        });

        if (postcodeResponse.ok) {
          const postcodeData = await postcodeResponse.json();
          console.log('PostcodeAPI.nu response:', postcodeData);
          
          if (postcodeData.street && postcodeData.city) {
            return NextResponse.json({
              success: true,
              street: postcodeData.street,
              city: postcodeData.city,
              postalCode: cleanPostalCode,
              houseNumber: houseNumber
            });
          }
        }
      } catch (postcodeError) {
        console.log('PostcodeAPI.nu failed, trying PDOK:', postcodeError);
      }

      // Fallback to PDOK API using suggest endpoint
      const suggestUrl = `https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest?q=${cleanPostalCode}+${houseNumber}&fq=type:adres`;
      
      const suggestResponse = await fetch(suggestUrl, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!suggestResponse.ok) {
        throw new Error('Address lookup failed');
      }

      const suggestData = await suggestResponse.json();
      
      console.log('PDOK Suggest API full response:', JSON.stringify(suggestData, null, 2));
      
      if (suggestData.response && suggestData.response.docs && suggestData.response.docs.length > 0) {
        const address = suggestData.response.docs[0];
        console.log('Address object:', JSON.stringify(address, null, 2));
        console.log('All address keys:', Object.keys(address));
        
        // Extract street name - try multiple fields
        let street = '';
        if (address.straatnaam) {
          street = address.straatnaam;
        } else if (address.weergavenaam) {
          // Parse weergavenaam: "Straatnaam 123, 1234AB Plaatsnaam"
          const weergave = address.weergavenaam;
          // Remove house number and postal code
          street = weergave.split(',')[0].trim().replace(/\s+\d+.*$/, '').trim();
        }
        
        const city = address.woonplaatsnaam || '';
        
        console.log('Extracted values:', { 
          street, 
          city, 
          straatnaam: address.straatnaam,
          woonplaatsnaam: address.woonplaatsnaam,
          weergavenaam: address.weergavenaam 
        });
        
        // Return success even with partial data
        return NextResponse.json({
          success: true,
          street: street || '',
          city: city || '',
          postalCode: address.postcode || cleanPostalCode,
          houseNumber: address.huisnummer || houseNumber,
          debug: {
            rawAddress: address,
            extractedStreet: street,
            extractedCity: city
          }
        });
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

