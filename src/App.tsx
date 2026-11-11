import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { LoginView } from './components/auth/LoginView';
import { DashboardView } from './components/views/DashboardView';
import { ProductsView } from './components/views/ProductsView';
import { SalesView } from './components/views/SalesView';
import { PurchasesView } from './components/views/PurchasesView';
import { ExpensesView } from './components/views/ExpensesView';
import { DebtsView } from './components/views/DebtsView';
import { StatementsView } from './components/views/StatementsView';
import { EmployeesView } from './components/views/EmployeesView';
import { ReportsView } from './components/views/ReportsView';
import { PrintTemplatesView } from './components/views/PrintTemplatesView';
import { BackupRestoreView } from './components/views/BackupRestoreView';
import { SettingsView } from './components/views/SettingsView';
import { PrintPreviewModal } from './components/common/PrintPreviewModal';

const MainLayout: React.FC = () => {
  const { currentUser, activeTab } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!currentUser) {
    return <LoginView />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100 font-sans text-right dir-rtl">
      {/* Sidebar for Desktop & Drawer for Mobile */}
      <Sidebar isOpen={isSidebarOpen} onCloseMobile={() => setIsSidebarOpen(false)} />

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Sticky Header */}
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Dynamic Workspace View */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50/50">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'products' && <ProductsView />}
          {activeTab === 'sales' && <SalesView />}
          {activeTab === 'purchases' && <PurchasesView />}
          {activeTab === 'expenses' && <ExpensesView />}
          {activeTab === 'debts' && <DebtsView />}
          {activeTab === 'statements' && <StatementsView />}
          {activeTab === 'employees' && <EmployeesView />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'print-templates' && <PrintTemplatesView />}
          {activeTab === 'backup' && <BackupRestoreView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Print Modal */}
      <PrintPreviewModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
