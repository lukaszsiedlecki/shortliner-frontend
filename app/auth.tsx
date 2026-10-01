'use client';

import {createContext, FormEvent, ReactNode, useContext, useEffect, useState} from 'react';
import {apiFetch, getCsrfToken} from '@/lib/api';
import {Translation} from './locales';

export const LOGIN_URL = '/oauth2/authorization/keycloak';

export type User = {
  id: string;
  username: string;
  email: string | null;
  name: string | null;
};

// 'loading' until /api/me answers. Without the gateway (e.g. browsing :3000 directly) /api/me
// doesn't exist, which is treated as anonymous.
export type Me = {status: 'loading'} | {status: 'anonymous'} | {status: 'authenticated'; user: User};

const MeContext = createContext<Me>({status: 'loading'});

export function MeProvider({children}: {children: ReactNode}) {
  const [me, setMe] = useState<Me>({status: 'loading'});

  useEffect(() => {
    let cancelled = false;
    apiFetch('/api/me')
        .then(async (response) => {
          const data = response.ok ? await response.json() : null;
          if (cancelled) return;
          setMe(data?.authenticated
              ? {status: 'authenticated', user: {id: data.id, username: data.username, email: data.email, name: data.name}}
              : {status: 'anonymous'});
        })
        .catch(() => {
          if (!cancelled) setMe({status: 'anonymous'});
        });
    return () => {
      cancelled = true;
    };
  }, []);

  return <MeContext.Provider value={me}>{children}</MeContext.Provider>;
}

export function useMe(): Me {
  return useContext(MeContext);
}

const buttonClassName =
    'px-3 py-1.5 rounded-md text-sm font-semibold transition-colors';

export function AuthControls({t}: {t: Translation}) {
  const me = useMe();

  if (me.status === 'loading') {
    return null;
  }

  if (me.status === 'anonymous') {
    // Full-page navigation: login is a redirect chain to Keycloak and back, never a fetch.
    return (
        <a href={LOGIN_URL} className={`${buttonClassName} bg-blue-600 text-white hover:bg-blue-700`}>
          {t.authLogIn}
        </a>
    );
  }

  // Logout is a form POST (the gateway redirects cross-origin to Keycloak). The CSRF token is read
  // at submit time so it always matches the current cookie.
  const handleLogout = (event: FormEvent<HTMLFormElement>) => {
    const csrfInput = event.currentTarget.elements.namedItem('_csrf') as HTMLInputElement;
    csrfInput.value = getCsrfToken() ?? '';
  };

  return (
      <form method="post" action="/logout" onSubmit={handleLogout} className="flex items-center gap-2">
        <span className="text-sm text-gray-700">{me.user.username}</span>
        <input type="hidden" name="_csrf"/>
        <button
            type="submit"
            className={`${buttonClassName} border border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer`}
        >
          {t.authLogOut}
        </button>
      </form>
  );
}

export function LoginPrompt({t, message}: {t: Translation; message: string}) {
  return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3 text-center">
        <p className="text-yellow-800">{message}</p>
        <a
            href={LOGIN_URL}
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          {t.authLogIn}
        </a>
      </div>
  );
}
