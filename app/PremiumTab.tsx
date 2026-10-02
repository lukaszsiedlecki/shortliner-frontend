'use client';

import {useEffect, useState} from 'react';
import {apiFetch} from '@/lib/api';
import {LoginPrompt, useMe} from './auth';
import {Translation} from './locales';

const STORAGE_KEY = 'premiumPayment';
const POLL_INTERVAL_MS = 2000;
const PREMIUM_AMOUNT = 9.99;
const PREMIUM_CURRENCY = 'PLN';

type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

type StoredPayment = {
  id: string;
  status: PaymentStatus;
};

type PaymentResponse = {
  id: string;
  status: PaymentStatus;
  failureReason: string | null;
};

export default function PremiumTab({t}: {t: Translation}) {
  const [payment, setPayment] = useState<StoredPayment | null>(null);
  const [failureReason, setFailureReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);
  const me = useMe();

  // Load saved payment from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      setPayment(JSON.parse(saved));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const savePayment = (next: StoredPayment | null) => {
    setPayment(next);
    if (next) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Poll for a final status while a payment is pending
  useEffect(() => {
    if (!payment || payment.status !== 'PENDING' || me.status !== 'authenticated' || sessionExpired) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const response = await apiFetch(`/api/payment/api/payments/${payment.id}`);
        if (cancelled) return;
        if (response.status === 401) {
          setSessionExpired(true);
          return;
        }
        if (!response.ok) return;
        const data: PaymentResponse = await response.json();
        if (cancelled || data.status === 'PENDING') return;
        savePayment({id: data.id, status: data.status});
        setFailureReason(data.failureReason ?? null);
      } catch {
        // transient network/poll error, retry on next tick
      }
    };

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment?.id, payment?.status, me.status, sessionExpired]);

  const handleBuy = async () => {
    setLoading(true);
    setError('');
    setFailureReason(null);

    try {
      const response = await apiFetch('/api/payment/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({amount: PREMIUM_AMOUNT, currency: PREMIUM_CURRENCY}),
      });

      if (response.status === 401) {
        setSessionExpired(true);
        return;
      }
      if (!response.ok) {
        throw new Error(t.premiumErrorGeneric);
      }

      const data: PaymentResponse = await response.json();
      savePayment({id: data.id, status: data.status});
      if (data.status !== 'PENDING') {
        setFailureReason(data.failureReason ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.premiumErrorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    savePayment(null);
    setFailureReason(null);
    setError('');
  };

  return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100">{t.premiumTitle}</h2>
        <p className="text-center text-gray-600 dark:text-gray-400">{t.premiumDescription}</p>
        <p className="text-center text-3xl font-bold text-gray-800 dark:text-gray-100">{t.premiumPrice}</p>

        {me.status === 'anonymous' && <LoginPrompt t={t} message={t.premiumLoginRequired}/>}
        {me.status === 'authenticated' && sessionExpired && <LoginPrompt t={t} message={t.authSessionExpired}/>}
        {me.status === 'authenticated' && !sessionExpired && (
            <>
              {(!payment || payment.status === 'FAILED') && (
                  <button
                      onClick={handleBuy}
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? t.premiumProcessing : t.premiumBuyButton}
                  </button>
              )}

              {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-red-700 dark:text-red-300">
                    {error}
                  </div>
              )}

              {payment?.status === 'PENDING' && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg flex items-center gap-3">
                    <div
                        className="h-5 w-5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"/>
                    <span className="text-blue-700 dark:text-blue-300">{t.premiumPendingNotice}</span>
                  </div>
              )}

              {payment?.status === 'SUCCESS' && (
                  <div className="p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 rounded-lg space-y-2">
                    <p className="font-semibold text-green-800 dark:text-green-300">{t.premiumSuccessTitle}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t.premiumPaymentIdLabel} <span className="font-mono">{payment.id}</span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t.premiumSuccessDisclaimer}</p>
                  </div>
              )}

              {payment?.status === 'FAILED' && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg space-y-2">
                    <p className="font-semibold text-red-800 dark:text-red-200">{t.premiumFailedTitle}</p>
                    {failureReason && <p className="text-sm text-red-700 dark:text-red-300">{failureReason}</p>}
                    <button
                        onClick={handleRetry}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      {t.premiumRetryButton}
                    </button>
                  </div>
              )}
            </>
        )}
      </div>
  );
}
