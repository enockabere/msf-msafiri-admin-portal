import { useSession } from 'next-auth/react'
import { UserRole } from '@/lib/api'

export function useAuth() {
  const { data: session, status } = useSession()

  return {
    user: session?.user || null,
    isAuthenticated: status === 'authenticated',
    loading: status === 'loading',
    isAdmin: session?.user?.role ? ['SUPER_ADMIN', 'MT_ADMIN', 'HR_ADMIN', 'EVENT_ADMIN'].includes(session.user.role) : false,
    isSuperAdmin: session?.user?.role === 'SUPER_ADMIN',
    hasRole: (role: UserRole) => session?.user?.role === role,
    hasAnyRole: (roles: UserRole[]) => session?.user?.role ? roles.includes(session.user.role as UserRole) : false,
    accessToken: session?.user?.accessToken,
    firstLogin: session?.user?.firstLogin || false
  }
}