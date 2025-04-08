import { NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';

export function middleware(request) {
  const token = request.cookies.get('token') || (typeof window !== 'undefined' && localStorage.getItem('token'));

  // Проверяем роль для маршрутов /admin/*
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!token) {
      // Не перенаправляем, так как модальное окно будет показано в Navbar
      return NextResponse.next();
    }

    try {
      const decoded = jwtDecode(token);
      if (decoded.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url)); // Перенаправляем на главную, если не админ
      }
    } catch (err) {
      return NextResponse.next(); // Модальное окно будет показано
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};