import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    // Vynechame API routes a staticke subory Next.js
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)',
  ],
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Zisti domenu s ktorej prisla poziadavka (napr. a320.charlie-lima.eu)
  let hostname = req.nextUrl.hostname || '';

  // Tu si nastav tvoju hlavnu domenu (ak testujes lokalne, mozes to preskocit alebo nechat)
  const mainDomain = 'charlie-lima.eu';

  if (hostname.endsWith(`.${mainDomain}`)) {
    const subdomain = hostname.replace(`.${mainDomain}`, '');
    
    // Ak to neni "www" a nejaka subdomena tam naozaj je
    if (subdomain && subdomain !== 'www') {
      // Prepise "a320.charlie-lima.eu/" na interny Next.js route "/a320"
      // Takze to pobezi cez src/app/(checklist)/[aircraft]/page.tsx
      return NextResponse.rewrite(new URL(`/${subdomain}${url.pathname}`, req.url));
    }
  }

  return NextResponse.next();
}
