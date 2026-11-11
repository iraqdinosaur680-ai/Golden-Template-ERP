import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CreditCard,
  Search,
  User,
  Building,
  Phone,
  ArrowUpRight,
  ArrowDownLeft,
  FileSpreadsheet,
  PlusCircle,
  X,
  Plus,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { formatCurrency, getTodayDateString, getCurrentTimeString } from '../../utils/formatters';
import { NumberInput } from '../common/NumberInput';

export const DebtsView: React.FC = () => {
  const {
    sales,
    purchases,
    createSale,
    createPurchase,
    addSalePayment,
    addPurchasePayment,
    setActiveTab,
    openPrintModal,
    t,
    lang,
  } = useApp();

  const [activeTabType, setActiveTabType] = useState<'CUSTOMERS' | 'SUPPLIERS'>('CUSTOMERS');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<{
    name: string;
    phone?: string;
    company?: string;
    type: 'CUSTOMER' | 'SUPPLIER';
    debts: any[];
    totalDebt: number;
  } | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payNotes, setPayNotes] = useState('');

  // New Debt Modal State
  const [showAddDebtModal, setShowAddDebtModal] = useState(false);
  const [newDebtType, setNewDebtType] = useState<'CUSTOMER' | 'SUPPLIER'>('CUSTOMER');
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonPhone, setNewPersonPhone] = useState('');
  const [newPersonCompany, setNewPersonCompany] = useState('');
  const [newTotalAmount, setNewTotalAmount] = useState<number | ''>('');
  const [newPaidAmount, setNewPaidAmount] = useState<number | ''>('');
  const [newDebtDate, setNewDebtDate] = useState(getTodayDateString());
  const [newDebtNotes, setNewDebtNotes] = useState('');

  const handleAddDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim() || !newTotalAmount || Number(newTotalAmount) <= 0) return;

    const tot = Number(newTotalAmount);
    const paid = Number(newPaidAmount || 0);

    if (newDebtType === 'CUSTOMER') {
      createSale({
        customerName: newPersonName.trim(),
        customerPhone: newPersonPhone.trim() || undefined,
        customerCompany: newPersonCompany.trim() || undefined,
        items: [
          {
            productId: 'DEBT_RECORD',
            productName: newDebtNotes.trim() || 'تسجيل دين سابق / رصيد افتتاحي',
            quantity: 1,
            unitPrice: tot,
            unit: 'دين',
          },
        ],
        paidAmount: paid,
        discount: 0,
        tax: 0,
        date: newDebtDate || getTodayDateString(),
        time: getCurrentTimeString(),
        notes: newDebtNotes.trim() || 'تسجيل دين مباشر',
        isDeleted: false,
      });
    } else {
      createPurchase({
        supplierName: newPersonName.trim(),
        supplierPhone: newPersonPhone.trim() || undefined,
        supplierCompany: newPersonCompany.trim() || undefined,
        items: [
          {
            productId: 'DEBT_RECORD',
            productName: newDebtNotes.trim() || 'تسجيل دين سابق / رصيد افتتاحي',
            quantity: 1,
            unitPrice: tot,
            unit: 'دين',
          },
        ],
        paidAmount: paid,
        date: newDebtDate || getTodayDateString(),
        time: getCurrentTimeString(),
        notes: newDebtNotes.trim() || 'تسجيل دين مباشر للمورد',
        isDeleted: false,
      });
    }

    // Reset and close
    setShowAddDebtModal(false);
    setNewPersonName('');
    setNewPersonPhone('');
    setNewPersonCompany('');
    setNewTotalAmount('');
    setNewPaidAmount('');
    setNewDebtNotes('');
    setNewDebtDate(getTodayDateString());
  };

  // Group active sales by customer
  const customerDebtsMap = new Map<string, { name: string; phone?: string; company?: string; debts: any[]; totalDebt: number }>();
  sales
    .filter((s) => !s.isDeleted && s.debtAmount > 0)
    .forEach((s) => {
      const name = s.customerName || 'عميل عام';
      const key = name.trim().toLowerCase();
      if (!customerDebtsMap.has(key)) {
        customerDebtsMap.set(key, {
          name: name,
          phone: s.customerPhone,
          company: s.customerCompany,
          debts: [],
          totalDebt: 0,
        });
      }
      const item = customerDebtsMap.get(key)!;
      item.debts.push(s);
      item.totalDebt += s.debtAmount;
    });

  const customerList = Array.from(customerDebtsMap.values()).filter((c) =>
    (c.name || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  // Group active purchases by supplier
  const supplierDebtsMap = new Map<string, { name: string; phone?: string; company?: string; debts: any[]; totalDebt: number }>();
  purchases
    .filter((p) => !p.isDeleted && p.debtAmount > 0)
    .forEach((p) => {
      const name = p.supplierName || 'مورد عام';
      const key = name.trim().toLowerCase();
      if (!supplierDebtsMap.has(key)) {
        supplierDebtsMap.set(key, {
          name: name,
          phone: p.supplierPhone,
          company: p.supplierCompany,
          debts: [],
          totalDebt: 0,
        });
      }
      const item = supplierDebtsMap.get(key)!;
      item.debts.push(p);
      item.totalDebt += p.debtAmount;
    });

  const supplierList = Array.from(supplierDebtsMap.values()).filter((s) =>
    (s.name || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTabType]);

  const activeList = activeTabType === 'CUSTOMERS' ? customerList : supplierList;
  const totalRows = activeList.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const paginatedList = activeList.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalCustomerDebts = Array.from(customerDebtsMap.values()).reduce((sum, c) => sum + c.totalDebt, 0);
  const totalSupplierDebts = Array.from(supplierDebtsMap.values()).reduce((sum, s) => sum + s.totalDebt, 0);

  const handlePayDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerson || !payAmount) return;

    let remainingToPay = Number(payAmount);

    if (selectedPerson.type === 'CUSTOMER') {
      // Apply payment to customer's oldest unpaid sales first
      for (const sale of selectedPerson.debts) {
        if (remainingToPay <= 0) break;
        const amountForThis = Math.min(sale.debtAmount, remainingToPay);
        addSalePayment(sale.id, amountForThis, 'تسديد من صفحة الديون', payNotes);
        remainingToPay -= amountForThis;
      }
    } else {
      // Apply payment to supplier's oldest unpaid purchases first
      for (const pur of selectedPerson.debts) {
        if (remainingToPay <= 0) break;
        const amountForThis = Math.min(pur.debtAmount, remainingToPay);
        addPurchasePayment(pur.id, amountForThis, payNotes);
        remainingToPay -= amountForThis;
      }
    }

    setSelectedPerson(null);
    setPayAmount('');
    setPayNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-xs border border-gray-100">
        <div>
          <h2 className="text-xl font-black text-gray-900">{t('debts')}</h2>
          <p className="text-xs text-gray-500">إدارة المستحقات المطلوبة من الزبائن والديون المستحقة للموردين</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setNewDebtType(activeTabType === 'CUSTOMERS' ? 'CUSTOMER' : 'SUPPLIER');
              setShowAddDebtModal(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-slate-950 shadow-md hover:bg-amber-600 transition"
          >
            <Plus className="h-4 w-4" />
            إضافة دين جديد / رصيد سابق
          </button>

          {/* Tab Switcher */}
          <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-bold">
            <button
              onClick={() => setActiveTabType('CUSTOMERS')}
              className={`rounded-lg px-4 py-2 transition ${
                activeTabType === 'CUSTOMERS' ? 'bg-amber-500 text-slate-950 font-black shadow-xs' : 'text-gray-600'
              }`}
            >
              {t('customerDebts')} ({customerList.length})
            </button>
            <button
              onClick={() => setActiveTabType('SUPPLIERS')}
              className={`rounded-lg px-4 py-2 transition ${
                activeTabType === 'SUPPLIERS' ? 'bg-blue-600 text-white font-black shadow-xs' : 'text-gray-600'
              }`}
            >
              {t('companyLiabilities')} ({supplierList.length})
            </button>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-amber-50 p-5 border border-amber-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-800">مجموع ديون الزبائن (لنا لدى الغير)</span>
            <h3 className="text-2xl font-black text-amber-900 mt-1">{formatCurrency(totalCustomerDebts, lang)}</h3>
          </div>
          <div className="rounded-xl bg-amber-500 p-3 text-slate-950">
            <ArrowUpRight className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl bg-blue-50 p-5 border border-blue-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-blue-800">مجموع ديون الموردين (علينا للغير)</span>
            <h3 className="text-2xl font-black text-blue-900 mt-1">{formatCurrency(totalSupplierDebts, lang)}</h3>
          </div>
          <div className="rounded-xl bg-blue-600 p-3 text-white">
            <ArrowDownLeft className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={`بحث باسم ${activeTabType === 'CUSTOMERS' ? 'الزبون' : 'المورد'}...`}
          className="w-full rounded-xl border border-gray-200 bg-white py-2 pr-9 pl-3 text-sm focus:outline-none"
        />
      </div>

      {/* Main List */}
      {paginatedList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center text-gray-400 font-semibold">
          لا توجد مستحقات مالية مطابقة لخيارات البحث الحالية
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedList.map((item, idx) => {
              const isCustomer = activeTabType === 'CUSTOMERS';
              return (
                <div 
                  key={idx} 
                  className={`rounded-2xl bg-white p-5 shadow-xs border transition ${
                    isCustomer ? 'border-gray-200 hover:border-amber-400' : 'border-gray-200 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-gray-900">{item.name}</h3>
                      {item.phone && <p className="text-xs text-gray-500 mt-0.5">{item.phone}</p>}
                    </div>
                    <span className={`rounded-lg px-2.5 py-1 text-xs font-black ${
                      isCustomer ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {formatCurrency(item.totalDebt, lang)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mt-3">
                    {isCustomer ? 'عدد الفواتير المطلوبة:' : 'عدد فواتير الشراء:'} {item.debts.length} فواتير
                  </p>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() => setActiveTab('statements')}
                      className="flex items-center gap-1 text-indigo-600 font-bold hover:underline"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      كشف حساب
                    </button>

                    <button
                      onClick={() => setSelectedPerson({ ...item, type: isCustomer ? 'CUSTOMER' : 'SUPPLIER' })}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                        isCustomer ? 'bg-amber-500 text-slate-950 hover:bg-amber-600' : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      تسديد دفعة
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grid Pagination Footer */}
          {totalRows > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border border-gray-150 rounded-2xl bg-gray-50/50 p-4 mt-4 text-xs font-bold text-gray-500 select-none">
              <div className="flex items-center gap-2">
                <span>عرض</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-gray-200 bg-white p-1 text-xs font-bold text-gray-700 focus:outline-none"
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                  <option value={96}>96</option>
                </select>
                <span>جهات من أصل {totalRows} جهة مدينة</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition"
                >
                  <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                  <span>السابق</span>
                </button>

                <span className="text-gray-700 font-extrabold px-2">
                  صفحة {currentPage} من {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white transition"
                >
                  <span>التالي</span>
                  <ChevronLeft className="h-3.5 w-3.5 shrink-0" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Pay Modal */}
      {selectedPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-gray-900">
                تسديد دفعة حساب ({selectedPerson.name})
              </h3>
              <button onClick={() => setSelectedPerson(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePayDirectSubmit} className="space-y-4 text-xs">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                <p className="text-gray-500">إجمالي الدين المتبقي:</p>
                <p className="text-xl font-black text-rose-600 mt-1">{formatCurrency(selectedPerson.totalDebt, lang)}</p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">المبلغ المراد تسديده الآن (د.ع) *</label>
                <NumberInput
                  required
                  placeholder="0"
                  value={payAmount}
                  onChange={(val) => setPayAmount(val === '' ? '' : parseFloat(val))}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-sm font-bold text-emerald-700 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">ملاحظات والتفاصيل</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedPerson(null)}
                  className="rounded-xl border border-gray-300 px-4 py-2 font-bold text-gray-700"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 font-extrabold text-white shadow-md hover:bg-emerald-700"
                >
                  تأكيد خصم الدفعة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Debt / Balance Modal */}
      {showAddDebtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-amber-500" />
                تسجيل دين جديد / رصيد افتتاحي
              </h3>
              <button onClick={() => setShowAddDebtModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddDebtSubmit} className="space-y-4 text-xs">
              {/* Debt Type Selector */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">جهة الدين *</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewDebtType('CUSTOMER')}
                    className={`flex-1 py-2 rounded-xl font-bold border text-xs transition ${
                      newDebtType === 'CUSTOMER'
                        ? 'bg-amber-500 text-slate-950 border-amber-500 font-extrabold shadow-xs'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                  >
                    زبون (مستحق لنا لدى الغير)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewDebtType('SUPPLIER')}
                    className={`flex-1 py-2 rounded-xl font-bold border text-xs transition ${
                      newDebtType === 'SUPPLIER'
                        ? 'bg-blue-600 text-white border-blue-600 font-extrabold shadow-xs'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                  >
                    مورد (مستحق علينا للغير)
                  </button>
                </div>
              </div>

              {/* Person Name */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  اسم {newDebtType === 'CUSTOMER' ? 'الزبون' : 'المورد'} *
                </label>
                <input
                  type="text"
                  required
                  list="all-person-names"
                  placeholder="أدخل الاسم..."
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-sm font-bold focus:border-amber-500 focus:outline-none"
                />
                <datalist id="all-person-names">
                  {Array.from(
                    new Set([
                      ...sales.map((s) => s.customerName).filter(Boolean),
                      ...purchases.map((p) => p.supplierName).filter(Boolean),
                    ])
                  ).map((n, idx) => (
                    <option key={`dl-name-${n}-${idx}`} value={n} />
                  ))}
                </datalist>
              </div>

              {/* Phone & Company */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">رقم الهاتف (اختياري)</label>
                  <input
                    type="text"
                    value={newPersonPhone}
                    onChange={(e) => setNewPersonPhone(e.target.value)}
                    placeholder="07xxxxxxxxx"
                    className="w-full rounded-xl border border-gray-300 p-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">اسم الشركة / المحل (اختياري)</label>
                  <input
                    type="text"
                    value={newPersonCompany}
                    onChange={(e) => setNewPersonCompany(e.target.value)}
                    placeholder="شركة..."
                    className="w-full rounded-xl border border-gray-300 p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Amount & Paid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">المبلغ الإجمالي للدين (د.ع) *</label>
                  <NumberInput
                    required
                    placeholder="0"
                    value={newTotalAmount}
                    onChange={(val) => setNewTotalAmount(val)}
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-sm font-black text-rose-600 focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">المدفوع حالياً (الواصل)</label>
                  <NumberInput
                    placeholder="0"
                    value={newPaidAmount}
                    onChange={(val) => setNewPaidAmount(val)}
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-sm font-black text-emerald-600 focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Remaining Debt preview */}
              {newTotalAmount !== '' && (
                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex justify-between items-center text-xs">
                  <span className="font-bold text-amber-900">صافي الدين المتبقي الذي سيسجل:</span>
                  <span className="font-black text-rose-700 text-sm">
                    {formatCurrency(Math.max(0, Number(newTotalAmount) - Number(newPaidAmount || 0)), lang)}
                  </span>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">تاريخ الدين *</label>
                <input
                  type="date"
                  required
                  value={newDebtDate}
                  onChange={(e) => setNewDebtDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2 text-xs font-semibold focus:outline-none"
                />
              </div>

              {/* Statement Notes */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">البيان / تفاصيل الدين / ملاحظات</label>
                <input
                  type="text"
                  placeholder="مثال: رصيد سابق من سنة 2024 / بضاعة بدون فاتورة"
                  value={newDebtNotes}
                  onChange={(e) => setNewDebtNotes(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddDebtModal(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 font-bold text-gray-700"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 px-5 py-2 font-black text-slate-950 shadow-md hover:bg-amber-600"
                >
                  حفظ وتسجيل الدين
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
