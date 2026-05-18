import { NextRequest, NextResponse } from 'next/server'

export function proxy(req: NextRequest) {
  const session = req.cookies.get('admin_session')?.value
  if (session !== 'authenticated') {
    return NextResponse.redirect(new URL('/admin', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/dashboard/:path*', '/admin/schedule/:path*', '/admin/settings/:path*', '/admin/clients/:path*', '/admin/comercial/:path*'],
}
