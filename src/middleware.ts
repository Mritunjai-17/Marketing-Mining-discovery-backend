import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /admin routes except public authentication pages (/admin/login, /admin/register)
  const isAuthPage = pathname === '/admin/login' || pathname === '/admin/register';
  const isProtectedAdminRoute = pathname.startsWith('/admin') && !isAuthPage;

  if (isProtectedAdminRoute) {
    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      const redirectResponse = NextResponse.redirect(loginUrl);

      // Disable any caching of the protected redirect
      redirectResponse.headers.set(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
      );
      redirectResponse.headers.set('Pragma', 'no-cache');
      redirectResponse.headers.set('Expires', '0');

      return redirectResponse;
    }
  }

  // If already logged in and visiting login or register, optionally allow or pass through
  const response = NextResponse.next();

  // Enforce zero-cache headers across all admin routes to prevent back-button disclosure
  if (pathname.startsWith('/admin')) {
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
