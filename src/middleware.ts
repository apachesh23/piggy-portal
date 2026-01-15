import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    
    // Если нет токена - редирект на логин
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // ✅ НОВОЕ: Если пользователь отключен - форсируем logout
    if (token.is_active === false) {
      console.log(`❌ Access denied: User is disabled`);
      return NextResponse.redirect(new URL('/api/auth/signout?callbackUrl=/login', req.url));
    }
    
    // Проверка доступа к /teamleader/*
    if (path.startsWith('/reports') || 
        path.startsWith('/time-worked') || 
        path.startsWith('/weekend')) {
      const permissionLevel = (token as any).permission_level;
      if (permissionLevel !== 'teamleader' && permissionLevel !== 'admin' && permissionLevel !== 'dev') {
        return NextResponse.redirect(new URL('/statistics', req.url));
      }
    }
    
    // Проверка доступа к /admin/*
    if (path.startsWith('/user-management') || path.startsWith('/system')) {
      const permissionLevel = (token as any).permission_level;
      if (permissionLevel !== 'admin' && permissionLevel !== 'dev') {
        return NextResponse.redirect(new URL('/statistics', req.url));
      }
    }
    
    // Доступ к /system только для dev
    if (path.startsWith('/system')) {
      const permissionLevel = (token as any).permission_level;
      if (permissionLevel !== 'dev') {
        return NextResponse.redirect(new URL('/statistics', req.url));
      }
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
  ],
};