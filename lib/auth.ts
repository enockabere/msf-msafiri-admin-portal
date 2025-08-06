// File: lib/auth.ts (Session management utilities)

import { User, UserRole } from './api';

export interface SessionData {
  user: User;
  token: string;
  loginTime: string;
  firstLogin: boolean;
  welcomeMessage?: string;
  expiresAt?: string;
}

export class SessionManager {
  private static readonly SESSION_KEY = 'msafiri_session';
  private static readonly USER_KEY = 'msafiri_user';
  private static readonly TOKEN_KEY = 'access_token';

  // Create and store session
  static createSession(sessionData: SessionData): void {
    if (typeof window === 'undefined') return;

    // Set expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    const fullSessionData = {
      ...sessionData,
      expiresAt: expiresAt.toISOString()
    };

    localStorage.setItem(this.SESSION_KEY, JSON.stringify(fullSessionData));
    localStorage.setItem(this.USER_KEY, JSON.stringify(sessionData.user));
    localStorage.setItem(this.TOKEN_KEY, sessionData.token);
  }

  // Get current session
  static getSession(): SessionData | null {
    if (typeof window === 'undefined') return null;

    try {
      const sessionStr = localStorage.getItem(this.SESSION_KEY);
      if (!sessionStr) return null;

      const session: SessionData = JSON.parse(sessionStr);
      
      // Check if session is expired
      if (session.expiresAt && new Date() > new Date(session.expiresAt)) {
        this.clearSession();
        return null;
      }

      return session;
    } catch {
      this.clearSession();
      return null;
    }
  }

  // Get current user
  static getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;

    try {
      const userStr = localStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  // Get current token
  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    const session = this.getSession();
    return session !== null && session.token !== null;
  }

  // Check if user has specific role
  static hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  // Check if user has any of the specified roles
  static hasAnyRole(roles: UserRole[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  // Check if user is admin (any admin role)
  static isAdmin(): boolean {
    return this.hasAnyRole([
      UserRole.SUPER_ADMIN,
      UserRole.MT_ADMIN,
      UserRole.HR_ADMIN,
      UserRole.EVENT_ADMIN
    ]);
  }

  // Check if user is super admin
  static isSuperAdmin(): boolean {
    return this.hasRole(UserRole.SUPER_ADMIN);
  }

  // Update session with new data
  static updateSession(updates: Partial<SessionData>): void {
    const currentSession = this.getSession();
    if (!currentSession) return;

    const updatedSession = { ...currentSession, ...updates };
    this.createSession(updatedSession);
  }

  // Clear session (logout)
  static clearSession(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
  }

  // Refresh session expiration
  static refreshSession(): void {
    const session = this.getSession();
    if (session) {
      this.createSession(session); // This will update the expiration time
    }
  }

  // Get session status
  static getSessionStatus(): {
    isAuthenticated: boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    user: User | null;
    timeRemaining?: number; // minutes
  } {
    const session = this.getSession();
    const user = this.getCurrentUser();
    
    let timeRemaining: number | undefined;
    if (session?.expiresAt) {
      const remaining = new Date(session.expiresAt).getTime() - Date.now();
      timeRemaining = Math.max(0, Math.floor(remaining / (1000 * 60))); // minutes
    }

    return {
      isAuthenticated: this.isAuthenticated(),
      isAdmin: this.isAdmin(),
      isSuperAdmin: this.isSuperAdmin(),
      user,
      timeRemaining
    };
  }
}

// File: middleware.ts (Next.js middleware for route protection)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require admin access
const PROTECTED_ROUTES = [
  '/dashboard',
  '/users',
  '/tenants',
  '/notifications',
  '/settings',
  '/reports',
  '/admin'
];

// Define routes that require super admin access
const SUPER_ADMIN_ROUTES = [
  '/tenants',
  '/settings/system',
  '/admin/system'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files, API routes, and public routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/images') ||
    pathname === '/' ||
    pathname === '/login'
  ) {
    return NextResponse.next();
  }

  // Check if route requires protection
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Get session data from request headers (you might need to adjust this)
  const sessionToken = request.cookies.get('msafiri_token')?.value ||
                      request.headers.get('authorization')?.replace('Bearer ', '');

  if (!sessionToken) {
    // Redirect to login if no token
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For super admin routes, you might want additional checks
  const requiresSuperAdmin = SUPER_ADMIN_ROUTES.some(route =>
    pathname.startsWith(route)
  );

  if (requiresSuperAdmin) {
    // You could decode the token here to check user role
    // For now, we'll let the component handle role-based rendering
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon|images).*)',
  ],
};

