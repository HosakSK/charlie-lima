import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const icao = searchParams.get('icao')?.toUpperCase();

  if (!icao) {
    return NextResponse.json({ error: 'ICAO is required' }, { status: 400 });
  }

  try {
    const response = await fetch('https://data.vatsim.net/v3/vatsim-data.json', {
      next: { revalidate: 60 } // Cache for 60 seconds
    });
    
    if (!response.ok) throw new Error('VATSIM data unavailable');
    
    const data = await response.json();
    
    // Find ATIS
    const atis = data.atis?.find((a: any) => a.callsign.startsWith(icao));
    
    return NextResponse.json({
      icao: icao,
      atis_code: atis?.atis_code || null,
      text_atis: atis?.text_atis || null,
      online: !!atis
    });
  } catch (error) {
    console.error('VATSIM ATIS Error:', error);
    return NextResponse.json({ error: 'Failed to fetch VATSIM data' }, { status: 500 });
  }
}
