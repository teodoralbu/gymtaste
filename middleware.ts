import { NextResponse, type NextRequest } from 'next/server'

// Auth protection is handled at the page level.
// Middleware is kept minimal to avoid edge runtime failures.
export function middleware(request: NextRequest) {
  return NextResponse.next({ request })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
