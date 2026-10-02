'use client';

import {useEffect, useState} from 'react';
import {apiFetch} from '@/lib/api';
import {AuthControls} from './auth';
import {ThemeToggle} from './theme';
import {Language, translations} from './locales';
import PremiumTab from './PremiumTab';

type Tab = 'shorten' | 'premium';

export default function Home() {
  const [language, setLanguage] = useState<Language>('pl');
  const [tab, setTab] = useState<Tab>('shorten');
  const [url, setUrl] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const t = translations[language];

  // Load saved language from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'pl' || savedLanguage === 'en')) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language to localStorage when it changes
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const handleGenerate = async () => {
    if (!url) {
      setError(t.errorNoUrl);
      return;
    }

    setLoading(true);
    setError('');
    setShortCode('');

    try {
      const response = await apiFetch('/api/shortliner/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({url}),
      });

      if (response.status === 401) {
        // Shortening is allowed anonymously; 401 only means the gateway session's token expired.
        throw new Error(t.authSessionExpired);
      }
      if (!response.ok) {
        throw new Error(t.errorShortening);
      }

      const data = await response.json();
      setShortCode(data.shortCode);
      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow-md dark:shadow-none dark:border dark:border-gray-800 p-8">
          {/* Language Selector + auth */}
          <div className="flex justify-between items-center mb-4">
            <AuthControls t={t}/>
            <div className="flex items-center gap-2 ml-auto">
              <ThemeToggle t={t}/>
              <label htmlFor="language" className="text-sm text-gray-600 dark:text-gray-400">
                {t.language}:
              </label>
              <select
                  id="language"
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value as Language)}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-900 cursor-pointer"
              >
                <option value="pl">Polski</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-100">
            {t.title}
          </h1>

          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8">
            <button
                onClick={() => setTab('shorten')}
                className={`flex-1 py-3 font-semibold border-b-2 transition-colors ${
                    tab === 'shorten'
                        ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
            >
              {t.tabShorten}
            </button>
            <button
                onClick={() => setTab('premium')}
                className={`flex-1 py-3 font-semibold border-b-2 transition-colors ${
                    tab === 'premium'
                        ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
            >
              {t.tabPremium}
            </button>
          </div>

          {tab === 'shorten' && (
              <div className="space-y-4">
                <div>
                  <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder={t.inputPlaceholder}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-100"
                  />
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? t.generating : t.generateButton}
                </button>

                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-red-700 dark:text-red-300">
                      {error}
                    </div>
                )}

                {shortCode && (
                    <div className="p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t.shortenedLinkLabel}</p>
                      <a
                          href={`/api/shortliner/shorten/${shortCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-lg font-mono font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline block break-all"
                      >
                        {window.location.origin}/api/shortliner/shorten/{shortCode}
                      </a>
                    </div>
                )}
              </div>
          )}

          {tab === 'premium' && <PremiumTab t={t}/>}
        </div>
      </div>
  );
}
