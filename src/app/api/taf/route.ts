import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get('ids');

  if (!ids) {
    return NextResponse.json({ error: 'ids parameter is required' }, { status: 400 });
  }

  try {
    const url = `https://aviationweather.gov/api/data/taf?ids=${encodeURIComponent(ids)}&format=json`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Charlie-Lima Virtual Flight Finder'
      },
      next: { revalidate: 600 } // Cache for 10 minutes
    });

    if (!response.ok) {
      throw new Error(`AviationWeather returned status ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('TAF API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch TAF' }, { status: 500 });
  }
}
