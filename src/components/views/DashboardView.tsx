import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Receipt,
  ReceiptText,
  CreditCard,
  Package,
  Users,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Filter,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../utils/formatters';

type TimeFilter = 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'CUSTOM';

export const DashboardView: React.FC = () => {
  const {
    sales,
    purchases,
    expenses,
    products,
    employees,
    payrolls,
    t,
    lang,
    setActiveTab,
    openPrintModal,
  } = useApp();

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('MONTH');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Active (non-deleted) transactions
  const activeSales = sales.filter((s) => !s.isDeleted);
  const activePurchases = purchases.filter((p) => !p.isDeleted);
  const activeExpenses = expenses.filter((e) => !e.isDeleted);

  // Filter by date
  const filterByDate = (dateStr: string) => {
    if (!dateStr) return true;
    const now = new Date();
    const d = new Date(dateStr);

    if (timeFilter === 'TODAY') {
      return d.toDateString() === now.toDateString();
    }
    if (timeFilter === 'WEEK') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d >= oneWeekAgo;
    }
    if (timeFilter === 'MONTH') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (timeFilter === 'YEAR') {
      return d.getFullYear() === now.getFullYear();
    }
    if (timeFilter === 'CUSTOM') {
      if (startDate && d < new Date(startDate)) return false;
      if (endDate && d > new Date(endDate)) return false;
      return true;
    }
    return true;
  };

  const filteredSales = activeSales.filter((s) => filterByDate(s.date));
  const filteredPurchases = activePurchases.filter((p) => filterByDate(p.date));
  const filteredExpenses = activeExpenses.filter((e) => filterByDate(e.date));

  // 1. Sales & Inflows (+)
  const totalSalesAmount = filteredSales.reduce((sum, s) => sum + s.finalTotal, 0);
  const totalSalesPaid = filteredSales.reduce((sum, s) => sum + s.paidAmount, 0);
  const customerDebtsAmount = filteredSales.reduce((sum, s) => sum + s.debtAmount, 0);

  // 2. Customer Debt Collected (+) [debt repayments outside initial downpayment]
  const customerDebtCollected = activeSales.reduce((sum, s) => {
    const pays = (s.payments || []).filter(
      (p) => filterByDate(p.date) && p.notes !== 'دفعة عند إنشاء الفاتورة'
    );
    return sum + pays.reduce((pSum, p) => pSum + (p.amount || 0), 0);
  }, 0);

  // 3. Purchases & Outflows (-)
  const totalPurchasesAmount = filteredPurchases.reduce((sum, p) => sum + p.finalTotal, 0);
  const totalPurchasesPaid = filteredPurchases.reduce((sum, p) => sum + p.paidAmount, 0);
  const supplierDebtsAmount = filteredPurchases.reduce((sum, p) => sum + p.debtAmount, 0);

  // 4. Supplier Debt Paid (-) [debt settlements paid to suppliers outside initial invoice]
  const supplierDebtPaid = activePurchases.reduce((sum, pur) => {
    const pays = (pur.payments || []).filter(
      (p) => filterByDate(p.date) && p.notes !== 'دفعة للشراء عند الفاتورة'
    );
    return sum + pays.reduce((pSum, p) => pSum + (p.amount || 0), 0);
  }, 0);

  // 5. Salaries & Payroll Paid (-)
  const salariesPaid = (payrolls || []).reduce((sum, payr) => {
    const pays = (payr.paymentHistory || []).filter((p) => filterByDate(p.date));
    if (pays.length > 0) {
      return sum + pays.reduce((pSum, p) => pSum + (p.amount || 0), 0);
    }
    if (payr.paidSalary > 0 && filterByDate(`${payr.month}-01`)) {
      return sum + payr.paidSalary;
    }
    return sum;
  }, 0);

  // 6. Expenses & Operating Services (-)
  const totalExpensesAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Total Comprehensive Inflow (+)
  const totalInflow = totalSalesAmount + customerDebtCollected;

  // Total Comprehensive Outflow (-)
  const totalOutflow = totalPurchasesAmount + supplierDebtPaid + salariesPaid + totalExpensesAmount;

  // Comprehensive Net Profit:
  // (+ Sales) + (+ Customer Debt Collected) - (- Purchases) - (- Supplier Debt Paid) - (- Salaries) - (- Expenses)
  const netProfit = totalInflow - totalOutflow;

  // Cost of Goods Sold (COGS) calculation based on production/purchase cost snapshot
  const cogs = filteredSales.reduce((totalCogs, sale) => {
    const saleCogs = sale.items.reduce((itemCogs, item) => {
      const prod = products.find((p) => p.id === item.productId);
      const unitCost = item.productionCostSnapshot || prod?.effectiveProductionCost || prod?.purchasePrice || 0;
      return itemCogs + (item.quantity * unitCost);
    }, 0);
    return totalCogs + saleCogs;
  }, 0);

  const grossProfit = totalSalesAmount - cogs;

  // Inventory Metrics
  const inventoryValue = products.reduce((sum, p) => sum + (p.quantity * (p.effectiveProductionCost || p.purchasePrice || 0)), 0);
  const lowStockProducts = products.filter((p) => p.quantity <= p.minStock && p.quantity > 0);
  const outOfStockProducts = products.filter((p) => p.quantity <= 0);

  return (
    <div className="space-y-6">
      {/* Top Bar with Time Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-xs border border-gray-100">
        <div>
          <h2 className="text-xl font-black text-gray-900">{t('dashboard')}</h2>
          <p className="text-xs text-gray-500">مؤشرات الأداء المالي والمبيعات والمخزون في الوقت الحالي</p>
        </div>

        {/* Time Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-bold text-gray-700">
            {(['TODAY', 'WEEK', 'MONTH', 'YEAR', 'CUSTOM'] as TimeFilter[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeFilter(tf)}
                className={`rounded-lg px-3 py-1.5 transition ${
                  timeFilter === tf
                    ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                    : 'hover:text-amber-600'
                }`}
              >
                {tf === 'TODAY' && t('today')}
                {tf === 'WEEK' && t('thisWeek')}
                {tf === 'MONTH' && t('thisMonth')}
                {tf === 'YEAR' && t('thisYear')}
                {tf === 'CUSTOM' && t('customRange')}
              </button>
            ))}
          </div>

          {timeFilter === 'CUSTOM' && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-gray-300 p-1.5 focus:border-amber-500"
              />
              <span>إلى</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-gray-300 p-1.5 focus:border-amber-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Profit Card */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 p-5 text-white shadow-lg">
          <div className="flex items-center justify-between opacity-90">
            <span className="text-xs font-bold">{t('netProfit')}</span>
            <div className="rounded-xl bg-white/20 p-2">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <h3 className="mt-3 text-2xl font-black tracking-tight">{formatCurrency(netProfit, lang)}</h3>
          <p className="mt-1 text-[11px] opacity-90 font-medium">
            (المبيعات + تحصيل الديون) - (المشتريات + تسديد الديون + الرواتب + المصاريف)
          </p>
        </div>

        {/* Total Sales Card */}
        <div className="rounded-2xl bg-white p-5 shadow-xs border border-gray-100">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold">{t('totalSales')}</span>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </div>
          <h3 className="mt-3 text-2xl font-black text-gray-900">{formatCurrency(totalSalesAmount, lang)}</h3>
          <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
            <span>الواصل: <strong className="text-emerald-600 font-bold">{formatCurrency(totalSalesPaid, lang)}</strong></span>
            <span>الآجل: <strong className="text-rose-600 font-bold">{formatCurrency(customerDebtsAmount, lang)}</strong></span>
          </div>
        </div>

        {/* Total Purchases Card */}
        <div className="rounded-2xl bg-white p-5 shadow-xs border border-gray-100">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold">{t('totalPurchases')}</span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <h3 className="mt-3 text-2xl font-black text-gray-900">{formatCurrency(totalPurchasesAmount, lang)}</h3>
          <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
            <span>المدفوع: <strong className="text-blue-600 font-bold">{formatCurrency(totalPurchasesPaid, lang)}</strong></span>
            <span>علينا للموردين: <strong className="text-rose-600 font-bold">{formatCurrency(supplierDebtsAmount, lang)}</strong></span>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="rounded-2xl bg-white p-5 shadow-xs border border-gray-100">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold">{t('totalExpenses')}</span>
            <div className="rounded-xl bg-rose-50 p-2 text-rose-600">
              <ReceiptText className="h-5 w-5" />
            </div>
          </div>
          <h3 className="mt-3 text-2xl font-black text-gray-900">{formatCurrency(totalExpensesAmount, lang)}</h3>
          <p className="mt-1 text-[11px] text-gray-400">كهرباء، رواتب، نقل، صيانة وخدمات</p>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white p-4 border border-gray-100 text-right">
          <p className="text-xs font-semibold text-gray-500">{t('customerDebts')}</p>
          <p className="text-lg font-black text-rose-600 mt-1">{formatCurrency(customerDebtsAmount, lang)}</p>
        </div>
        <div className="rounded-xl bg-white p-4 border border-gray-100 text-right">
          <p className="text-xs font-semibold text-gray-500">{t('companyLiabilities')}</p>
          <p className="text-lg font-black text-amber-700 mt-1">{formatCurrency(supplierDebtsAmount, lang)}</p>
        </div>
        <div className="rounded-xl bg-white p-4 border border-gray-100 text-right">
          <p className="text-xs font-semibold text-gray-500">{t('inventoryValue')}</p>
          <p className="text-lg font-black text-indigo-600 mt-1">{formatCurrency(inventoryValue, lang)}</p>
        </div>
        <div className="rounded-xl bg-white p-4 border border-gray-100 text-right">
          <p className="text-xs font-semibold text-gray-500">عدد المنتجات والموظفين</p>
          <p className="text-lg font-black text-gray-800 mt-1">
            {products.length} منتج / {employees.length} موظف
          </p>
        </div>
      </div>

      {/* Comprehensive Net Profit Real-Time Formula Breakdown */}
      <div className="rounded-2xl bg-white p-5 shadow-xs border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-black text-gray-900">مكونات صافي الأرباح الشامل (التدفقات المالية الحقيقية)</h3>
            <p className="text-xs text-gray-500">تأثير كل حركة بالزيادة (+) أو النقصان (-) على صافي الربح الفعلي</p>
          </div>
          <span className={`text-xs font-black px-3 py-1 rounded-full ${netProfit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
            الصافي الحالي: {formatCurrency(netProfit, lang)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {/* + Sales */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white font-bold text-xs">+</span>
              <div>
                <span className="font-bold text-gray-800">1. المبيعات</span>
                <p className="text-[10px] text-gray-500">إيرادات فواتير البيع</p>
              </div>
            </div>
            <span className="font-black text-emerald-700 text-sm">+{formatCurrency(totalSalesAmount, lang)}</span>
          </div>

          {/* + Customer Debt Collections */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white font-bold text-xs">+</span>
              <div>
                <span className="font-bold text-gray-800">2. تحصيل ديون الزبائن</span>
                <p className="text-[10px] text-gray-500">دفعات واردة من الزبائن</p>
              </div>
            </div>
            <span className="font-black text-emerald-700 text-sm">+{formatCurrency(customerDebtCollected, lang)}</span>
          </div>

          {/* - Purchases */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/60 border border-rose-100">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white font-bold text-xs">-</span>
              <div>
                <span className="font-bold text-gray-800">3. المشتريات</span>
                <p className="text-[10px] text-gray-500">تكاليف توريد البضاعة</p>
              </div>
            </div>
            <span className="font-black text-rose-700 text-sm">-{formatCurrency(totalPurchasesAmount, lang)}</span>
          </div>

          {/* - Supplier Debt Paid */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/60 border border-rose-100">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white font-bold text-xs">-</span>
              <div>
                <span className="font-bold text-gray-800">4. تسديد ديون الموردين</span>
                <p className="text-[10px] text-gray-500">دفعات مسددة للموردين</p>
              </div>
            </div>
            <span className="font-black text-rose-700 text-sm">-{formatCurrency(supplierDebtPaid, lang)}</span>
          </div>

          {/* - Salaries */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/60 border border-rose-100">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white font-bold text-xs">-</span>
              <div>
                <span className="font-bold text-gray-800">5. رواتب الموظفين</span>
                <p className="text-[10px] text-gray-500">مسيرات الرواتب المصروفة</p>
              </div>
            </div>
            <span className="font-black text-rose-700 text-sm">-{formatCurrency(salariesPaid, lang)}</span>
          </div>

          {/* - Expenses & Services */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/60 border border-rose-100">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white font-bold text-xs">-</span>
              <div>
                <span className="font-bold text-gray-800">6. المصاريف والخدمات</span>
                <p className="text-[10px] text-gray-500">الكهرباء والصيانة والتشغيل</p>
              </div>
            </div>
            <span className="font-black text-rose-700 text-sm">-{formatCurrency(totalExpensesAmount, lang)}</span>
          </div>
        </div>
      </div>

      {/* Warnings & Inventory Status */}
      {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
        <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200">
          <div className="flex items-center gap-2 text-amber-900 font-bold mb-3 text-sm">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            تنبيهات المخزون الحرجة
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {lowStockProducts.map((p) => (
              <div key={p.id} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-amber-200">
                <span className="font-bold text-gray-800">{p.name} ({p.sku})</span>
                <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-bold">
                  متبقي {p.quantity} {p.unit} (حد الأدنى {p.minStock})
                </span>
              </div>
            ))}
            {outOfStockProducts.map((p) => (
              <div key={p.id} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-rose-200">
                <span className="font-bold text-gray-800">{p.name} ({p.sku})</span>
                <span className="text-rose-700 bg-rose-100 px-2 py-0.5 rounded font-bold">
                  منتهي بالكامل!
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales Table */}
        <div className="rounded-2xl bg-white p-5 shadow-xs border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-gray-900 text-sm">{t('recentSales')}</h3>
            <button
              onClick={() => setActiveTab('sales')}
              className="text-xs font-bold text-amber-600 hover:underline"
            >
              عرض الكل &larr;
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold">
                <tr>
                  <th className="p-2">رقم الفاتورة</th>
                  <th className="p-2">الزبون</th>
                  <th className="p-2">المبلغ</th>
                  <th className="p-2">الواصل</th>
                  <th className="p-2">الطباعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSales.slice(0, 5).map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="p-2 font-bold text-amber-700">{sale.invoiceNo}</td>
                    <td className="p-2">{sale.customerName || 'زبون عام'}</td>
                    <td className="p-2 font-bold text-gray-900">{formatCurrency(sale.finalTotal, lang)}</td>
                    <td className="p-2 text-emerald-600 font-semibold">{formatCurrency(sale.paidAmount, lang)}</td>
                    <td className="p-2">
                      <button
                        onClick={() => openPrintModal(`فاتورة مبيعات ${sale.invoiceNo}`, 'SALE', sale)}
                        className="rounded bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-200"
                      >
                        طباعة
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Purchases Table */}
        <div className="rounded-2xl bg-white p-5 shadow-xs border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-gray-900 text-sm">{t('recentPurchases')}</h3>
            <button
              onClick={() => setActiveTab('purchases')}
              className="text-xs font-bold text-amber-600 hover:underline"
            >
              عرض الكل &larr;
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold">
                <tr>
                  <th className="p-2">رقم الفاتورة</th>
                  <th className="p-2">المورد</th>
                  <th className="p-2">المبلغ</th>
                  <th className="p-2">المدفوع</th>
                  <th className="p-2">الطباعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPurchases.slice(0, 5).map((pur) => (
                  <tr key={pur.id} className="hover:bg-gray-50">
                    <td className="p-2 font-bold text-blue-700">{pur.invoiceNo}</td>
                    <td className="p-2">{pur.supplierName}</td>
                    <td className="p-2 font-bold text-gray-900">{formatCurrency(pur.finalTotal, lang)}</td>
                    <td className="p-2 text-blue-600 font-semibold">{formatCurrency(pur.paidAmount, lang)}</td>
                    <td className="p-2">
                      <button
                        onClick={() => openPrintModal(`فاتورة مشتريات ${pur.invoiceNo}`, 'PURCHASE', pur)}
                        className="rounded bg-blue-100 px-2 py-1 text-[11px] font-bold text-blue-800 hover:bg-blue-200"
                      >
                        طباعة
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
