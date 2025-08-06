import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Additional middleware logic here if needed
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect admin routes
        const { pathname } = req.nextUrl

        if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
          return token?.role && ['SUPER_ADMIN', 'MT_ADMIN', 'HR_ADMIN', 'EVENT_ADMIN'].includes(token.role as string)
        }

        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/dashboard/:path*', '/users/:path*', '/admin/:path*']
}