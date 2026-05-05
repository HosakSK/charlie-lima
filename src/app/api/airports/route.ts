import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const icao = searchParams.get('icao');

  if (!icao) {
    return NextResponse.json({ error: 'ICAO is required' }, { status: 400 });
  }

  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'atc', 'airports_atc.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    if (data[icao.toUpperCase()]) {
      return NextResponse.json(data[icao.toUpperCase()]);
    } else {
      return NextResponse.json({ error: 'Airport not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Airports API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
