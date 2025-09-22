"use client";

import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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
      } catch (error) {
        window.location.href = '/login?sessionExpired=true';
      }
    };

    const checkSession = async () => {
      if (status === 'authenticated' && session?.user?.accessToken) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me`, {
            headers: {
              'Authorization': `Bearer ${session.user.accessToken}`
            }
          });
          
          if (!response.ok) {
            await handleSessionTimeout();
          }
        } catch (error) {
          await handleSessionTimeout();
        }
      }
    };

    if (status === 'authenticated') {
      timeoutId = setInterval(checkSession, 5 * 60 * 1000);
      
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