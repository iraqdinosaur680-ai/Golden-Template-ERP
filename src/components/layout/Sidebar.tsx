import React from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  ReceiptText,
  CreditCard,
  FileSpreadsheet,
  Users,
  BarChart3,
  Printer,
  DatabaseBackup,
  Settings,
  X,
} from 'lucide-react';
import { AppLogo } from '../common/AppLogo';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { activeTab, setActiveTab, t, currentUser, companySettings } = useApp();

  const navItems: { id: ActiveTab; labelKey: string; icon: any; permission?: keyof typeof currentUser.permissions }[] = [
    { id: 'dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
    { id: 'products', labelKey: 'products', icon: Package, permission: 'manageProducts' },
    { id: 'sales', labelKey: 'sales', icon: ShoppingCart, permission: 'manageSales' },
    { id: 'purchases', labelKey: 'purchases', icon: Receipt, permission: 'managePurchases' },
    { id: 'expenses', labelKey: 'expenses', icon: ReceiptText, permission: 'manageExpenses' },
    { id: 'debts', labelKey: 'debts', icon: CreditCard, permission: 'manageDebts' },
    { id: 'statements', labelKey: 'statements', icon: FileSpreadsheet, permission: 'manageDebts' },
    { id: 'employees', labelKey: 'employees', icon: Users, permission: 'manageEmployees' },
    { id: 'reports', labelKey: 'reports', icon: BarChart3, permission: 'viewFinancialReports' },
    { id: 'print-templates', labelKey: 'printTemplates', icon: Printer, permission: 'manageTemplates' },
    { id: 'backup', labelKey: 'backup', icon: DatabaseBackup, permission: 'manageBackups' },
    { id: 'settings', labelKey: 'settings', icon: Settings },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden backdrop-blur-2xs"
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header of Sidebar */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          <div className="flex items-center space-x-2.5 space-x-reverse">
            <AppLogo size="sm" className="h-8 w-8" />
            <span className="text-xs font-black text-amber-400 tracking-wider uppercase">
              GOLDEN TEMPLATE
            </span>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            // Check permission if specified
            if (
              item.permission &&
              currentUser &&
              !currentUser.permissions[item.permission] &&
              currentUser.role !== 'ADMIN'
            ) {
              return null;
            }

            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center space-x-3 space-x-reverse px-3 py-2.5 rounded-xl font-bold text-xs transition ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-amber-500'}`} />
                <span className="truncate">{t(item.labelKey as any)}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer info inside sidebar */}
        <div className="border-t border-slate-800 p-4 text-center bg-slate-950/40">
          <div className="rounded-xl bg-slate-800/30 p-3 text-[11px] text-slate-400 border border-slate-800/50">
            <span className="block text-[10px] font-bold text-slate-500 mb-2">تطوير وتشغيل</span>
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black text-emerald-400 border border-emerald-500/20 shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              KHDMAT TEAM - فريق خدمات
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
