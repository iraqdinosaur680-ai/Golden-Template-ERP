import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, User as UserIcon, LogIn, Eye, EyeOff, Phone, MessageCircle, Send, Instagram } from 'lucide-react';
import { AppLogo } from '../common/AppLogo';

export const LoginView: React.FC = () => {
  const { login, t, companySettings } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    const success = login(username.trim(), password.trim());
    if (!success) {
      setError(t('invalidCredentials') || 'اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-tr from-emerald-50/70 via-slate-50 to-teal-50/60 p-4 font-sans" dir="rtl">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-emerald-100/80">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-24 w-24 items-center justify-center mb-4 transition-transform hover:scale-105 duration-300">
            <AppLogo size="xl" className="h-24 w-24" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">{companySettings.companyNameArabic}</h2>
          <p className="mt-1.5 text-xs font-bold text-emerald-600 tracking-wide">{companySettings.tagline}</p>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-100/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            تسجيل الدخول الآمن للنظام
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700 border border-rose-100 text-center animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('username')}</label>
            <div className="relative">
              <UserIcon className="absolute right-3.5 top-3.5 h-4 w-4 text-emerald-600/70" />
              <input
                type="text"
                required
                autoComplete="username"
                placeholder="اسم المستخدم (مثال: admin)"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError('');
                }}
                className="w-full rounded-xl border border-slate-200 py-3 pr-10 pl-3.5 text-sm font-semibold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all bg-white text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('password')}</label>
            <div className="relative">
              <Lock className="absolute right-3.5 top-3.5 h-4 w-4 text-emerald-600/70" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                className="w-full rounded-xl border border-slate-200 py-3 pr-10 pl-11 text-sm font-semibold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all bg-white text-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-3 p-1 text-slate-400 hover:text-emerald-600 focus:outline-none transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-600/10 hover:bg-emerald-700 transition duration-200 active:scale-[0.98] cursor-pointer mt-4"
          >
            <LogIn className="h-4.5 w-4.5" />
            {t('login')}
          </button>
        </form>
      </div>

      {/* Beautiful Green Theme Khadamat Team Contact Footer */}
      <div className="mt-6 w-full max-w-md bg-emerald-950 text-slate-100 p-5 rounded-2xl border border-emerald-800/60 shadow-xl text-center relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-12 -left-12 w-24 h-24 rounded-full bg-emerald-500/10 blur-xl"></div>
        <div className="absolute -bottom-12 -right-12 w-24 h-24 rounded-full bg-emerald-500/10 blur-xl"></div>

        <p className="font-extrabold text-sm text-emerald-100 tracking-wide flex items-center justify-center gap-2">
          <span>تم التطوير بواسطة</span>
          <span className="bg-emerald-500 text-emerald-950 px-2.5 py-0.5 rounded-lg font-black text-xs shadow-xs">
            KHDMAT TEAM - فريق خدمات
          </span>
        </p>
        
        <div className="mt-4 flex flex-col gap-2.5">
          {companySettings.devContactPhone && (
            <div className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-200 bg-emerald-900/40 py-1.5 px-3 rounded-xl border border-emerald-800/30">
              <Phone className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>هاتف الدعم والمبيعات:</span>
              <a href={`tel:${companySettings.devContactPhone}`} className="text-white hover:underline hover:text-emerald-300 transition dir-ltr">
                {companySettings.devContactPhone}
              </a>
            </div>
          )}
          
          <div className="flex items-center justify-center gap-2.5 mt-1.5">
            {companySettings.devWhatsapp && (
              <a
                href={`https://wa.me/${companySettings.devWhatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 bg-emerald-900/60 hover:bg-emerald-900 border border-emerald-800/60 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-300 hover:text-emerald-200 hover:border-emerald-700 transition"
              >
                <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
                <span>واتساب</span>
              </a>
            )}
            {companySettings.devTelegram && (
              <a
                href={`https://t.me/${companySettings.devTelegram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 bg-emerald-900/60 hover:bg-emerald-900 border border-emerald-800/60 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-300 hover:text-emerald-200 hover:border-emerald-700 transition"
              >
                <Send className="h-3.5 w-3.5 text-emerald-400" />
                <span>تليجرام</span>
              </a>
            )}
            {companySettings.devInstagram && (
              <a
                href={`https://instagram.com/${companySettings.devInstagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 bg-emerald-900/60 hover:bg-emerald-900 border border-emerald-800/60 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-300 hover:text-emerald-200 hover:border-emerald-700 transition"
              >
                <Instagram className="h-3.5 w-3.5 text-emerald-400" />
                <span>انستقرام</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

