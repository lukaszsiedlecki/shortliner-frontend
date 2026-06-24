'use client';

import {useEffect, useState} from 'react';
import {Language, translations} from './locales';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function Home() {
  const [language, setLanguage] = useState<Language>('pl');
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
      const response = await fetch(`${API_URL}/shorten`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({url}),
      });

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-8">
          {/* Language Selector */}
          <div className="flex justify-end mb-4">
            <div className="flex items-center gap-2">
              <label htmlFor="language" className="text-sm text-gray-600">
                {t.language}:
              </label>
              <select
                  id="language"
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value as Language)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 bg-white cursor-pointer"
              >
                <option value="pl">Polski</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
            {t.title}
          </h1>

          <div className="space-y-4">
            <div>
              <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={t.inputPlaceholder}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              />
            </div>

            <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t.generating : t.generateButton}
            </button>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
            )}

            {shortCode && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">{t.shortenedLinkLabel}</p>
                  <a
                      href={`${API_URL}/shorten/${shortCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-mono font-semibold text-blue-600 hover:text-blue-800 underline block break-all"
                  >
                    {API_URL}/shorten/{shortCode}
                  </a>
                </div>
            )}
          </div>
        </div>
      </div>
  );
}
