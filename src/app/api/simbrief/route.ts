import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let id = searchParams.get('userid');

  if (!id) {
    return NextResponse.json({ error: 'User ID or Username is required' }, { status: 400 });
  }

  // Clean the ID: remove $, {, }, and whitespace
  id = id.trim().replace(/[${}]/g, '');

  // SimBrief uses 'userid' for numeric Pilot IDs and 'username' for aliases
  const isNumeric = /^\d+$/.test(id);
  const paramName = isNumeric ? 'userid' : 'username';

  try {
    const response = await fetch(`https://www.simbrief.com/api/xml.fetcher.php?${paramName}=${id}&json=1`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch from SimBrief (HTTP ' + response.status + ')');
    }

    const data = await response.json();

    // Check if SimBrief returned its own error in the JSON
    if (data.fetch && data.fetch.status && data.fetch.status.includes('Error')) {
       return NextResponse.json({ error: data.fetch.status }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('SimBrief API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
