import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface Dataset {
  title: string;
  file: string;
}

export async function GET() {
  const dataDir = path.join(process.cwd(), 'public', 'data');
  const result: Record<string, Dataset[]> = {};

  try {
    const aircraftDirs = fs.readdirSync(dataDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const ac of aircraftDirs) {
      const acPath = path.join(dataDir, ac);
      const files = fs.readdirSync(acPath)
        .filter(file => file.endsWith('.js'));
      
      result[ac] = files.map(file => {
        // Vytvori pekny nazov: "europe_style.js" -> "Europe Style"
        const title = file
            .replace('.js', '')
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        return {
          title,
          file: `data/${ac}/${file}`
        };
      });
    }
    
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error reading datasets:', error);
    return NextResponse.json({ error: "Failed to read datasets" }, { status: 500 });
  }
}
