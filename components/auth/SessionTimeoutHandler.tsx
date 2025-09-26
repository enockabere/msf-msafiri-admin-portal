"use client";

import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { tokenManager } from '@/lib/token-refresh';

export default function SessionTimeoutHandler() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleSessionTimeout = async () => {
      try {
        localStorage.clear();
        sessionStorage.clear();
        
        await signOut({
          redirect: false,
          callbackUrl: '/login'
        });
        
        router.push('/login?sessionExpired=true');
      } catch  {
        window.location.href = '/login?sessionExpired=true';
      }
    };

    const checkSession = async () => {
      if (status === 'authenticated' && session?.user?.accessToken) {
        try {
          // Try to get a valid token (will refresh if needed)
          const validToken = await tokenManager.getValidToken();
          
          if (!validToken) {
            await handleSessionTimeout();
            return;
          }

          // Test the token with a simple API call
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me`, {
            headers: {
              'Authorization': `Bearer ${validToken}`
            }
          });
          
          if (!response.ok && response.status === 401) {
            // Token is invalid and refresh failed
            await handleSessionTimeout();
          }
        } catch {
          await handleSessionTimeout();
        }
      }
    };

    if (status === 'authenticated') {
      // Check session every 2 minutes instead of 5
      timeoutId = setInterval(checkSession, 2 * 60 * 1000);
      
      const handleFocus = () => checkSession();
      window.addEventListener('focus', handleFocus);
      
      return () => {
        clearInterval(timeoutId);
        window.removeEventListener('focus', handleFocus);
      };
    }

    return () => {
      if (timeoutId) clearInterval(timeoutId);
    };
  }, [session, status, router]);

  return null;
}