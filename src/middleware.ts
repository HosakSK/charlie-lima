import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get('host') || '';

  const currentHost = hostname.replace(`:${url.port}`, ''); // For localhost

  if (currentHost === 'admin.charlie-lima.eu') {
    url.pathname = `/admin${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  if (currentHost === 'charlie-lima.eu' || currentHost === 'www.charlie-lima.eu' || currentHost === 'localhost') {
    return NextResponse.rewrite(url); // Root landing page
  }

  // Extract subdomain for aircraft (e.g. b738)
  const subdomain = currentHost.split('.')[0];
  if (subdomain !== 'www') {
      url.pathname = `/${subdomain}${url.pathname}`;
  }
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
