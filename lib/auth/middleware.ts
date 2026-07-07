import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // هذا الكود يسمح بمرور كل شيء بدون قيود
  return NextResponse.next();
}

// نطاق عمل الـ Middleware (يستثني ملفات النظام والصور)
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
