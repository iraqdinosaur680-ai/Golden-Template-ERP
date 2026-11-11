import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  Printer,
  Calendar,
  TrendingUp,
  DollarSign,
  PieChart,
  FileText,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../utils/formatters';

export const ReportsView: React.FC = () => {
  const { sales, purchases, expenses, products, payrolls, openPrintModal, t, lang } = useApp();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const activeSales = sales.filter((s) => !s.isDeleted);
  const activePurchases = purchases.filter((p) => !p.isDeleted);
  const activeExpenses = expenses.filter((e) => !e.isDeleted);

  const filterDate = (dateStr: string) => {
    if (!dateStr) return true;
    if (startDate && dateStr < startDate) return false;
    if (endDate && dateStr > endDate) return false;
    return true;
  };

  const filteredSales = activeSales.filter((s) => filterDate(s.date));
  const filteredPurchases = activePurchases.filter((p) => filterDate(p.date));
  const filteredExpenses = activeExpenses.filter((e) => filterDate(e.date));

  // 1. Sales (+)
  const totalSales = filteredSales.reduce((sum, s) => sum + s.finalTotal, 0);
  const totalSalesPaid = filteredSales.reduce((sum, s) => sum + s.paidAmount, 0);

  // 2. Customer Debt Collected (+)
  const customerDebtCollected = activeSales.reduce((sum, s) => {
    const pays = (s.payments || []).filter(
      (p) => filterDate(p.date) && p.notes !== 'دفعة عند إنشاء الفاتورة'
    );
    return sum + pays.reduce((pSum, p) => pSum + (p.amount || 0), 0);
  }, 0);

  // 3. Purchases (-)
  const totalPurchases = filteredPurchases.reduce((sum, p) => sum + p.finalTotal, 0);
  const totalPurchasesPaid = filteredPurchases.reduce((sum, p) => sum + p.paidAmount, 0);

  // 4. Supplier Debt Paid (-)
  const supplierDebtPaid = activePurchases.reduce((sum, pur) => {
    const pays = (pur.payments || []).filter(
      (p) => filterDate(p.date) && p.notes !== 'دفعة للشراء عند الفاتورة'
    );
    return sum + pays.reduce((pSum, p) => pSum + (p.amount || 0), 0);
  }, 0);

  // 5. Salaries Paid (-)
  const salariesPaid = (payrolls || []).reduce((sum, payr) => {
    const pays = (payr.paymentHistory || []).filter((p) => filterDate(p.date));
    if (pays.length > 0) {
      return sum + pays.reduce((pSum, p) => pSum + (p.amount || 0), 0);
    }
    if (payr.paidSalary > 0 && filterDate(`${payr.month}-01`)) {
      return sum + payr.paidSalary;
    }
    return sum;
  }, 0);

  // 6. Expenses & Operating Services (-)
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Comprehensive Net Profit:
  // (+ Sales) + (+ Customer Debt Collected) - (- Purchases) - (- Supplier Debt Paid) - (- Salaries) - (- Expenses)
  const totalInflows = totalSales + customerDebtCollected;
  const totalOutflows = totalPurchases + supplierDebtPaid + salariesPaid + totalExpenses;
  const netProfit = totalInflows - totalOutflows;

  const cogs = filteredSales.reduce((sum, sale) => {
    const saleCogs = sale.items.reduce((itemCogs, item) => {
      const prod = products.find((p) => p.id === item.productId);
      const unitCost = item.productionCostSnapshot || prod?.effectiveProductionCost || prod?.purchasePrice || 0;
      return itemCogs + (item.quantity * unitCost);
    }, 0);
    return sum + saleCogs;
  }, 0);

  const grossProfit = totalSales - cogs;

  const handlePrintSummary = () => {
    openPrintModal('تقرير الأرباح والقوائم المالية الشاملة', 'STATEMENT', {
      personName: 'تقرير شامل الميزانية وحركات صافي الأرباح',
      type: 'SUMMARY',
      history: [
        { date: '1. مجموع المبيعات (+)', invoiceNo: '-', type: 'مبيعات (+)', total: totalSales, paid: totalSalesPaid, balance: totalSales - totalSalesPaid },
        { date: '2. تحصيل ديون الزبائن (+)', invoiceNo: '-', type: 'تحصيل ديون (+)', total: customerDebtCollected, paid: customerDebtCollected, balance: 0 },
        { date: '3. مجموع المشتريات (-)', invoiceNo: '-', type: 'مشتريات (-)', total: totalPurchases, paid: totalPurchasesPaid, balance: totalPurchases - totalPurchasesPaid },
        { date: '4. تسديد ديون الموردين (-)', invoiceNo: '-', type: 'تسديد ديون (-)', total: supplierDebtPaid, paid: supplierDebtPaid, balance: 0 },
        { date: '5. رواتب الموظفين (-)', invoiceNo: '-', type: 'رواتب (-)', total: salariesPaid, paid: salariesPaid, balance: 0 },
        { date: '6. إجمالي المصاريف والخدمات (-)', invoiceNo: '-', type: 'مصاريف (-)', total: totalExpenses, paid: totalExpenses, balance: 0 },
        { date: 'صافي الربح النهائي الشامل', invoiceNo: '-', type: 'صافي ربح', total: netProfit, paid: netProfit, balance: 0 },
      ],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-xs border border-gray-100">
        <div>
          <h2 className="text-xl font-black text-gray-900">{t('reports')}</h2>
          <p className="text-xs text-gray-500">التقارير المالية التحليلية، كشوفات الأرباح والخسائر وحركة المخزون</p>
        </div>

        <button
          onClick={handlePrintSummary}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-extrabold text-slate-950 shadow-md hover:bg-amber-600"
        >
          <Printer className="h-4 w-4" />
          طباعة التقرير المالي الشامل
        </button>
      </div>

      {/* Date Filter */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 text-xs">
        <span className="font-bold text-gray-700">تصفية حسب التاريخ:</span>
        <div className="flex items-center gap-2">
          <span>من:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-gray-300 p-2 font-semibold"
          />
        </div>
        <div className="flex items-center gap-2">
          <span>إلى:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-gray-300 p-2 font-semibold"
          />
        </div>
      </div>

      {/* Financial Income Statement Breakdown */}
      <div className="rounded-2xl bg-white p-6 shadow-xs border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-2 border-b">
          <h3 className="text-base font-black text-gray-900">قائمة الدخل وحساب صافي الأرباح (P&L)</h3>
          <span className="text-xs text-gray-500 font-semibold">تأثير شامل: مبيعات، مشتريات، ديون، رواتب، مصاريف</span>
        </div>

        <div className="space-y-3 text-xs">
          {/* + Sales */}
          <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50/70 text-emerald-950 font-bold border border-emerald-100">
            <span className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-black">+</span>
              1. إجمالي المبيعات (Sales):
            </span>
            <span className="text-sm font-black text-emerald-700">+{formatCurrency(totalSales, lang)}</span>
          </div>

          {/* + Customer Debt Collections */}
          <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50/70 text-emerald-950 font-bold border border-emerald-100">
            <span className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-black">+</span>
              2. تحصيلات ديون الزبائن (Customer Debt Collected):
            </span>
            <span className="text-sm font-black text-emerald-700">+{formatCurrency(customerDebtCollected, lang)}</span>
          </div>

          {/* - Purchases */}
          <div className="flex justify-between items-center p-3 rounded-xl bg-rose-50/70 text-rose-950 font-bold border border-rose-100">
            <span className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white text-[10px] font-black">-</span>
              3. إجمالي المشتريات (Purchases):
            </span>
            <span className="text-sm font-black text-rose-700">-{formatCurrency(totalPurchases, lang)}</span>
          </div>

          {/* - Supplier Debt Paid */}
          <div className="flex justify-between items-center p-3 rounded-xl bg-rose-50/70 text-rose-950 font-bold border border-rose-100">
            <span className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white text-[10px] font-black">-</span>
              4. تسديد ديون الموردين (Supplier Debt Paid):
            </span>
            <span className="text-sm font-black text-rose-700">-{formatCurrency(supplierDebtPaid, lang)}</span>
          </div>

          {/* - Salaries Paid */}
          <div className="flex justify-between items-center p-3 rounded-xl bg-rose-50/70 text-rose-950 font-bold border border-rose-100">
            <span className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white text-[10px] font-black">-</span>
              5. رواتب ومستحقات الموظفين (Salaries Paid):
            </span>
            <span className="text-sm font-black text-rose-700">-{formatCurrency(salariesPaid, lang)}</span>
          </div>

          {/* - Expenses */}
          <div className="flex justify-between items-center p-3 rounded-xl bg-rose-50/70 text-rose-950 font-bold border border-rose-100">
            <span className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white text-[10px] font-black">-</span>
              6. المصاريف التشغيلية والخدمات (Operating & Service Expenses):
            </span>
            <span className="text-sm font-black text-rose-700">-{formatCurrency(totalExpenses, lang)}</span>
          </div>

          {/* Grand Net Profit */}
          <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black text-base shadow-md mt-4">
            <div className="flex flex-col">
              <span>صافي الربح النهائي الشامل (Net Profit):</span>
              <span className="text-[11px] font-medium opacity-90">(المبيعات + تحصيل الديون) - (المشتريات + تسديد الديون + الرواتب + المصاريف)</span>
            </div>
            <span className="text-lg">{formatCurrency(netProfit, lang)}</span>
          </div>
        </div>
      </div>

      {/* Expenses by Category breakdown */}
      <div className="rounded-2xl bg-white p-6 shadow-xs border border-gray-200">
        <h3 className="text-base font-black text-gray-900 mb-4 pb-2 border-b">تحليل المصاريف والخدمات حسب التصنيف</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {Array.from(new Set(filteredExpenses.map((e) => e.category))).map((cat, idx) => {
            const catSum = filteredExpenses
              .filter((e) => e.category === cat)
              .reduce((sum, e) => sum + e.amount, 0);
            return (
              <div key={`rep-cat-${cat}-${idx}`} className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex justify-between items-center">
                <span className="font-bold text-gray-700">{cat}</span>
                <span className="font-extrabold text-rose-600">{formatCurrency(catSum, lang)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
