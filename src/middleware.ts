import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    '/((?!api|_next|_static|_vercel|[\\w-]+\\.\\w+).*)',
  ],
}

export function middleware(req: NextRequest) {
  // Zisti domenu s ktorej prisla poziadavka (napr. a320.charlie-lima.eu)
  let hostname = req.headers.get('host') || '';
  hostname = hostname.split(':')[0]; // fallback na povodne pre istotu

  // Tu si nastav tvoju hlavnu domenu (ak testujes lokalne, mozes to preskocit alebo nechat)
  const mainDomain = 'charlie-lima.eu';

  if (hostname.endsWith(`.${mainDomain}`)) {
    const subdomain = hostname.replace(`.${mainDomain}`, '');
    
    // Ak to neni "www" a nejaka subdomena tam naozaj je
    if (subdomain && subdomain !== 'www') {
      const url = req.nextUrl.clone();
      
      if (subdomain === 'creator') {
        url.pathname = '/creator.html';
        return NextResponse.rewrite(url);
      }
      
      // Rewrite "a320.charlie-lima.eu/" to "/a320"
      url.pathname = `/${subdomain}${req.nextUrl.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}
