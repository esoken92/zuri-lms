import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Disabled - using client-side auth protection only
  // The Supabase SSR client has performance issues with remote auth checks
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
