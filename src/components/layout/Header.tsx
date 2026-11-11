import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  Globe,
  LogOut,
  ShieldAlert,
  Menu,
} from 'lucide-react';
import { AuditLogModal } from '../common/AuditLogModal';
import { AppLogo } from '../common/AppLogo';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const {
    currentUser,
    logout,
    lang,
    setLang,
    companySettings,
    notifications,
    markNotificationRead,
    t,
  } = useApp();

  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-3 sm:px-4 lg:px-6 shadow-xs">
        {/* Left / Right Logo & Title area */}
        <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse min-w-0">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 focus:outline-none shrink-0"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse min-w-0">
            <div className="hidden xs:block shrink-0">
              <AppLogo size="md" className="h-10 w-10 sm:h-11 sm:w-11" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-extrabold text-gray-900 leading-tight truncate">
                {lang === 'ar' ? companySettings.companyNameArabic : companySettings.companyName}
              </h1>
              <p className="text-[10px] sm:text-[11px] font-semibold text-amber-600 leading-none truncate hidden sm:block">
                {t('appName')} • {companySettings.tagline}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & User Info */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 space-x-reverse shrink-0">
          {/* Real-time Cloud Connection Indicator */}
          <div
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shrink-0"
            title="قاعدة بيانات السحابة متصلة وتعمل بنظام الحفظ التلقائي الفوري"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline text-[11px] font-medium text-emerald-700">متصل بالسحابة</span>
          </div>

          {/* Small Audit Log Button */}
          {currentUser?.permissions.viewAuditLogs && (
            <button
              onClick={() => setIsAuditModalOpen(true)}
              title={t('auditLogs')}
              className="flex items-center gap-1 rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition shrink-0"
            >
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline text-xs font-semibold">{t('auditLogs')}</span>
            </button>
          )}

          {/* Notifications Bell */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 hover:text-amber-600 transition block"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-xl bg-white p-3 shadow-2xl border border-gray-100 z-50">
                <div className="flex items-center justify-between border-b pb-2 mb-2">
                  <h4 className="text-xs font-bold text-gray-900">التنبيهات والإشعارات</h4>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                    {unreadCount} جديد
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-gray-50">
                  {notifications.length === 0 ? (
                    <p className="py-4 text-center text-xs text-gray-400">لا توجد إشعارات</p>
                  ) : (
                    notifications.map((n, idx) => (
                      <div
                        key={`hdr-notif-${n.id}-${idx}`}
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-2 rounded-lg cursor-pointer text-xs transition ${
                          !n.read ? 'bg-amber-50/60 font-medium' : 'hover:bg-gray-50'
                        }`}
                      >
                        <p className="font-bold text-gray-800">{n.title}</p>
                        <p className="text-gray-600 text-[11px] mt-0.5">{n.message}</p>
                        <span className="text-[10px] text-gray-400 block mt-1 dir-ltr text-right">{n.date}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition shrink-0"
          >
            <Globe className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span className="hidden sm:inline">{lang === 'ar' ? 'English' : 'عربي'}</span>
            <span className="inline sm:hidden uppercase">{lang === 'ar' ? 'en' : 'ar'}</span>
          </button>

          {/* User Profile Info & Logout */}
          {currentUser && (
            <div className="flex items-center space-x-1.5 sm:space-x-2 space-x-reverse border-r pr-1.5 sm:pr-3 mr-0.5 sm:mr-1 border-gray-200 shrink-0">
              <div className="hidden md:block text-right">
                <p className="text-xs font-bold text-gray-800 leading-tight">{currentUser.fullName}</p>
                <span className="inline-block text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                  {t(currentUser.role as any) || currentUser.role}
                </span>
              </div>
              <button
                onClick={logout}
                title={t('logout')}
                className="rounded-lg bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 transition block shrink-0"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Audit Log Modal */}
      <AuditLogModal isOpen={isAuditModalOpen} onClose={() => setIsAuditModalOpen(false)} />
    </>
  );
};
