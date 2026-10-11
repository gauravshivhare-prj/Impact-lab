/**
 * Login Page for GhatRakshak.
 *
 * Government-inspired design matching the reference image:
 * - Warm ivory background with subtle Bhopal ghats illustration
 * - White card with cream header section
 * - MP government emblem with GhatRakshak branding side-by-side
 * - Muted maroon/vermilion color palette
 * - Development bypass for local testing only (DEV mode)
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Eye, EyeOff, LogIn, AlertCircle, Loader2, Triangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LoginPageProps {
  language: 'en' | 'hi';
}

export const LoginPage: React.FC<LoginPageProps> = ({ language }) => {
  const { login, enterDemoMode, isLoading, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (localError) setLocalError(null);
  }, [username, password]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLocalError(null);

      if (!username.trim()) {
        setLocalError(language === 'hi' ? 'उपयोगकर्ता नाम आवश्यक है' : 'Username is required');
        return;
      }

      if (!password) {
        setLocalError(language === 'hi' ? 'पासवर्ड आवश्यक है' : 'Password is required');
        return;
      }

      setIsSubmitting(true);

      try {
        await login(username.trim(), password);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        setLocalError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [username, password, login, language]
  );

  const handleDevBypass = useCallback(() => {
    enterDemoMode();
  }, [enterDemoMode]);

  const displayError = localError || error;
  const showLoader = isLoading || isSubmitting;
  const showDevBypass = import.meta.env.DEV;
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="min-h-screen bg-[#FDF8F3] flex flex-col relative overflow-hidden">
      {/* Background Illustration - Bhopal Ghats Silhouette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1400 800'%3E%3Cdefs%3E%3ClinearGradient id='fade' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23D4A574' stop-opacity='0'/%3E%3Cstop offset='60%25' stop-color='%23D4A574' stop-opacity='0.08'/%3E%3Cstop offset='100%25' stop-color='%23D4A574' stop-opacity='0.15'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23fade)' width='1400' height='800'/%3E%3Cg fill='%23C9956C' opacity='0.12'%3E%3C!-- Left side ghats --%3E%3Cpath d='M0 800 L0 650 Q50 640 80 660 L80 600 L120 600 L120 580 Q140 570 160 580 L160 550 L200 530 L200 800 Z'/%3E%3Cpath d='M180 800 L180 620 L220 600 L220 560 Q250 540 280 560 L280 520 L320 500 L320 800 Z'/%3E%3Crect x='100' y='520' width='30' height='80' rx='15'/%3E%3Crect x='250' y='480' width='25' height='70' rx='12'/%3E%3C!-- Temple dome left --%3E%3Cpath d='M60 600 Q60 540 100 520 Q140 540 140 600 Z'/%3E%3Ccircle cx='100' cy='510' r='8'/%3E%3C!-- Birds --%3E%3Cpath d='M150 450 Q160 440 170 450 M155 445 Q160 435 165 445'/%3E%3Cpath d='M320 420 Q330 410 340 420'/%3E%3C!-- Right side ghats --%3E%3Cpath d='M1100 800 L1100 620 L1140 600 L1140 560 L1180 540 L1180 800 Z'/%3E%3Cpath d='M1160 800 L1160 580 L1200 560 L1200 520 Q1230 500 1260 520 L1260 480 L1300 460 L1300 800 Z'/%3E%3Cpath d='M1280 800 L1280 550 L1320 530 L1320 490 L1360 470 L1400 470 L1400 800 Z'/%3E%3C!-- Temple domes right --%3E%3Cpath d='M1200 520 Q1200 460 1240 440 Q1280 460 1280 520 Z'/%3E%3Ccircle cx='1240' cy='430' r='8'/%3E%3Cpath d='M1320 490 Q1320 440 1350 425 Q1380 440 1380 490 Z'/%3E%3Ccircle cx='1350' cy='415' r='6'/%3E%3Crect x='1150' y='500' width='25' height='60' rx='12'/%3E%3C!-- Birds right --%3E%3Cpath d='M1120 400 Q1130 390 1140 400'/%3E%3Cpath d='M1050 430 Q1060 420 1070 430 M1055 425 Q1060 415 1065 425'/%3E%3C!-- Water reflection lines --%3E%3Cpath d='M0 780 Q200 775 400 780 Q600 785 800 780 Q1000 775 1200 780 Q1300 785 1400 780' stroke='%23C9956C' stroke-width='1' fill='none' opacity='0.3'/%3E%3Cpath d='M0 795 Q300 790 600 795 Q900 800 1200 795 L1400 798' stroke='%23C9956C' stroke-width='0.5' fill='none' opacity='0.2'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Header Bar */}
      <header className="w-full bg-white border-b border-slate-200/80 py-3 px-4 sm:px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/images/mp-mpsedc-logo.jpg"
              alt="Government of Madhya Pradesh and MPSeDC"
              className="h-10 sm:h-11 w-auto object-contain"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-px h-6 bg-slate-300 hidden sm:block" />
            <span className="text-sm text-[#8B4A3C] font-medium hidden sm:block">
              {language === 'hi' ? 'विसर्जन घाट निगरानी प्रणाली' : 'Visarjan Ghat Monitoring System'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <div
          className={`w-full max-w-lg ${
            prefersReducedMotion ? '' : 'animate-in fade-in slide-in-from-bottom-3 duration-500'
          }`}
          style={{ opacity: mounted ? 1 : 0, transition: prefersReducedMotion ? 'none' : 'opacity 0.3s' }}
        >
          {/* Login Card */}
          <div className="bg-white rounded-xl shadow-xl shadow-slate-900/5 border border-slate-200/60 overflow-hidden">
            {/* Saffron accent line at top */}
            <div className="h-1 bg-gradient-to-r from-[#E07B39] via-[#D4883A] to-[#E07B39]" />

            {/* Card Header - Cream background with logo and title side by side */}
            <div className="bg-gradient-to-b from-[#FFFBF7] to-[#FFF9F4] px-6 py-6 sm:py-8">
              <div className="flex items-center justify-center gap-4 sm:gap-6">
                {/* Government Emblem */}
                <div className="flex-shrink-0">
                  <img
                    src="/images/mp-government-emblem.png"
                    alt="Government of Madhya Pradesh Emblem"
                    className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
                  />
                </div>

                {/* Vertical Divider */}
                <div className="w-px h-16 sm:h-20 bg-slate-300/70" />

                {/* Title and Subtitle */}
                <div className="text-left">
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#7B3F3F] tracking-tight">
                    Ghat<span className="font-bold">रक्षक</span>
                  </h1>
                  <p className="text-sm sm:text-base text-[#6B7280] mt-1">
                    {language === 'hi'
                      ? 'विसर्जन घाट निगरानी प्रणाली'
                      : 'Visarjan Ghat Monitoring System'}
                  </p>
                  <p className="text-xs sm:text-sm text-[#9CA3AF] mt-0.5">
                    BMC · Bhopal
                  </p>
                </div>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Error Message */}
              {displayError && (
                <div
                  className="flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm animate-in fade-in duration-200"
                  role="alert"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                  <span>{displayError}</span>
                </div>
              )}

              {/* Username Field */}
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="block text-sm font-semibold text-[#374151]"
                >
                  {language === 'hi' ? 'उपयोगकर्ता नाम' : 'Username'}
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C45C3E]/30 focus:border-[#C45C3E] transition-all duration-200"
                  placeholder={language === 'hi' ? 'अपना उपयोगकर्ता नाम दर्ज करें' : 'Enter your username'}
                  autoComplete="username"
                  autoFocus
                  disabled={showLoader}
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-[#374151]"
                >
                  {language === 'hi' ? 'पासवर्ड' : 'Password'}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C45C3E]/30 focus:border-[#C45C3E] transition-all duration-200"
                    placeholder={language === 'hi' ? 'अपना पासवर्ड दर्ज करें' : 'Enter your password'}
                    autoComplete="current-password"
                    disabled={showLoader}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#C45C3E]/30"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={showLoader}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-[#B84233] text-white font-semibold hover:bg-[#9A3729] focus:outline-none focus:ring-2 focus:ring-[#B84233] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.99]"
              >
                {showLoader ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{language === 'hi' ? 'प्रवेश हो रहा है...' : 'Signing in...'}</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>{language === 'hi' ? 'प्रवेश करें' : 'Sign In'}</span>
                  </>
                )}
              </button>

              {/* Development Bypass - Only in Dev Mode */}
              {showDevBypass && (
                <>
                  {/* OR Divider */}
                  <div className="flex items-center gap-4 py-1">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">OR</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  <button
                    type="button"
                    onClick={handleDevBypass}
                    className="w-full flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-lg bg-[#FEF3EC] text-[#C45C3E] font-medium border border-[#E8A888] hover:bg-[#FDEBE0] hover:border-[#D4896A] transition-all duration-200"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <Triangle className="w-4 h-4" />
                      Dev Bypass — Enter Demo
                    </span>
                    <span className="text-xs text-[#9CA3AF] font-normal">
                      Local development preview only
                    </span>
                  </button>
                </>
              )}
            </form>

            {/* Card Footer */}
            <div className="px-6 pb-6 space-y-2">
              <p className="text-xs text-center text-slate-500">
                {language === 'hi'
                  ? 'यह एक सुरक्षित सरकारी प्रणाली है। केवल अधिकृत उपयोगकर्ताओं के लिए।'
                  : 'This is a secure government system. Authorized users only.'}
              </p>
              <p className="text-xs text-center text-slate-400">
                {language === 'hi'
                  ? 'प्रवेश संबंधी समस्या? अपने व्यवस्थापक से संपर्क करें।'
                  : 'Having trouble? Contact your system administrator.'}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 text-center relative z-10">
        <p className="text-xs text-slate-500">
          © 2026 Ghatरक्षक · Bhopal Municipal Corporation
        </p>
      </footer>
    </div>
  );
};

export default LoginPage;
