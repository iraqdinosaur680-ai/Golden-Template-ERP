import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileSpreadsheet,
  Printer,
  Search,
  Calendar,
  User,
  Building,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  PlusCircle,
  X,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { formatCurrency, getTodayDateString, getCurrentTimeString } from '../../utils/formatters';
import { NumberInput } from '../common/NumberInput';

export const StatementsView: React.FC = () => {
  const { sales, purchases, createSale, createPurchase, openPrintModal, t, lang } = useApp();

  const [statementType, setStatementType] = useState<'CUSTOMER' | 'SUPPLIER'>('CUSTOMER');
  const [selectedName, setSelectedName] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Add Debt Modal State
  const [showAddDebtModal, setShowAddDebtModal] = useState(false);
  const [newDebtType, setNewDebtType] = useState<'CUSTOMER' | 'SUPPLIER'>('CUSTOMER');
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonPhone, setNewPersonPhone] = useState('');
  const [newPersonCompany, setNewPersonCompany] = useState('');
  const [newTotalAmount, setNewTotalAmount] = useState<number | ''>('');
  const [newPaidAmount, setNewPaidAmount] = useState<number | ''>('');
  const [newDebtDate, setNewDebtDate] = useState(getTodayDateString());
  const [newDebtNotes, setNewDebtNotes] = useState('');

  // Extract names
  const customerNames = Array.from(new Set(sales.map((s) => s.customerName).filter(Boolean)));
  const supplierNames = Array.from(new Set(purchases.map((p) => p.supplierName).filter(Boolean)));

  const namesList = statementType === 'CUSTOMER' ? customerNames : supplierNames;

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
      setStatementType('CUSTOMER');
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
      setStatementType('SUPPLIER');
    }

    setSelectedName(newPersonName.trim());
    setShowAddDebtModal(false);
    setNewPersonName('');
    setNewPersonPhone('');
    setNewPersonCompany('');
    setNewTotalAmount('');
    setNewPaidAmount('');
    setNewDebtNotes('');
    setNewDebtDate(getTodayDateString());
  };

  // Build chronological ledger history
  const buildHistory = () => {
    if (!selectedName) return [];

    let rows: any[] = [];
    const targetName = (selectedName || '').trim().toLowerCase();

    if (statementType === 'CUSTOMER') {
      const customerSales = sales.filter(
        (s) => !s.isDeleted && (s.customerName || '').trim().toLowerCase() === targetName
      );

      customerSales.forEach((s) => {
        // Invoice Row
        rows.push({
          date: s.date,
          time: s.time,
          invoiceNo: s.invoiceNo,
          type: 'فاتورة مبيعات',
          total: s.finalTotal,
          paid: s.paidAmount,
          debtAdded: s.debtAmount,
          timestamp: new Date(s.date + ' ' + s.time).getTime(),
        });

        // Additional payments if recorded in history
        s.paymentHistory?.forEach((ph) => {
          rows.push({
            date: ph.date,
            time: '',
            invoiceNo: s.invoiceNo,
            type: 'تسديد دفعة',
            total: 0,
            paid: ph.amount,
            debtAdded: -ph.amount,
            notes: ph.notes,
            timestamp: new Date(ph.date).getTime(),
          });
        });
      });
    } else {
      const supplierPurchases = purchases.filter(
        (p) => !p.isDeleted && (p.supplierName || '').trim().toLowerCase() === targetName
      );

      supplierPurchases.forEach((p) => {
        rows.push({
          date: p.date,
          time: p.time,
          invoiceNo: p.invoiceNo,
          type: 'فاتورة مشتريات',
          total: p.finalTotal,
          paid: p.paidAmount,
          debtAdded: p.debtAmount,
          timestamp: new Date(p.date + ' ' + p.time).getTime(),
        });

        p.paymentHistory?.forEach((ph) => {
          rows.push({
            date: ph.date,
            time: '',
            invoiceNo: p.invoiceNo,
            type: 'تسديد دفعة للمورد',
            total: 0,
            paid: ph.amount,
            debtAdded: -ph.amount,
            notes: ph.notes,
            timestamp: new Date(ph.date).getTime(),
          });
        });
      });
    }

    // Sort chronologically
    rows.sort((a, b) => a.timestamp - b.timestamp);

    // Filter date range
    rows = rows.filter((r) => {
      if (startDate && r.date < startDate) return false;
      if (endDate && r.date > endDate) return false;
      return true;
    });

    // Calculate running balance
    let currentBalance = 0;
    return rows.map((r) => {
      currentBalance += r.debtAdded;
      return {
        ...r,
        balance: currentBalance,
      };
    });
  };

  const history = buildHistory();
  const currentTotalBalance = history.length > 0 ? history[history.length - 1].balance : 0;

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedName, statementType, startDate, endDate]);

  const totalRows = history.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const paginatedHistory = history.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handlePrintStatement = () => {
    if (!selectedName) return;
    openPrintModal(`كشف حساب تفصيلي - ${selectedName}`, 'STATEMENT', {
      personName: selectedName,
      type: statementType,
      history,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-xs border border-gray-100">
        <div>
          <h2 className="text-xl font-black text-gray-900">{t('statements')}</h2>
          <p className="text-xs text-gray-500">كشف حساب زبون أو مورد بحركات الفواتير والتسديدات المتسلسلة زمنياً</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setNewDebtType(statementType);
              setShowAddDebtModal(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-slate-950 shadow-md hover:bg-amber-600 transition"
          >
            <Plus className="h-4 w-4" />
            إضافة دين / حركة جديدة
          </button>

          <button
            onClick={handlePrintStatement}
            disabled={!selectedName || history.length === 0}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-extrabold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            طباعة كشف الحساب
          </button>
        </div>
      </div>

      {/* Filter Options */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-gray-100 text-xs">
        <div>
          <label className="block font-bold text-gray-700 mb-1">نوع الحساب</label>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setStatementType('CUSTOMER');
                setSelectedName(customerNames[0] || '');
              }}
              className={`flex-1 py-2 rounded-lg font-bold border transition ${
                statementType === 'CUSTOMER' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-gray-50 text-gray-600'
              }`}
            >
              حساب زبون
            </button>
            <button
              onClick={() => {
                setStatementType('SUPPLIER');
                setSelectedName(supplierNames[0] || '');
              }}
              className={`flex-1 py-2 rounded-lg font-bold border transition ${
                statementType === 'SUPPLIER' ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600'
              }`}
            >
              حساب مورد
            </button>
          </div>
        </div>

        <div>
          <label className="block font-bold text-gray-700 mb-1">اختر الاسم / الجهة</label>
          <div className="relative">
            <input
              type="text"
              list="statement-names-datalist"
              value={selectedName}
              onChange={(e) => setSelectedName(e.target.value)}
              placeholder="اختر أو ابحث عن الاسم..."
              className="w-full rounded-lg border border-gray-300 p-2 font-bold focus:border-amber-500 focus:outline-none bg-white text-xs"
            />
            <datalist id="statement-names-datalist">
              {Array.from(new Set(namesList || [])).map((n, idx) => (
                <option key={`stmt-dl-${n}-${idx}`} value={n} />
              ))}
            </datalist>
          </div>
        </div>

        <div>
          <label className="block font-bold text-gray-700 mb-1">من تاريخ</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2 font-semibold focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-bold text-gray-700 mb-1">إلى تاريخ</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2 font-semibold focus:outline-none"
          />
        </div>
      </div>

      {/* Statement Results */}
      {selectedName ? (
        <div className="rounded-2xl bg-white shadow-xs border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap justify-between items-center gap-2">
            <div>
              <h3 className="text-base font-extrabold text-gray-900">كشف حركة حساب: {selectedName}</h3>
              <p className="text-xs text-gray-500">إجمالي الحركات المسجلة: {history.length}</p>
            </div>
            <div className="text-left">
              <span className="text-xs text-gray-500 block">الرصيد المتبقي النهائي:</span>
              <span className="text-xl font-black text-rose-600">{formatCurrency(currentTotalBalance, lang)}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-amber-50 font-extrabold text-amber-900 border-b border-amber-200">
                <tr>
                  <th className="p-3">التاريخ والوقت</th>
                  <th className="p-3">رقم الفاتورة / الحركة</th>
                  <th className="p-3">نوع الحركة</th>
                  <th className="p-3">المبلغ الإجمالي</th>
                  <th className="p-3">الواصل / المسدد</th>
                  <th className="p-3">الرصيد التراكمي المتبقي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400 font-semibold">
                      لا توجد حركات مسجلة لهذا الحساب للفترة المحددة
                    </td>
                  </tr>
                ) : (
                  paginatedHistory.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/80 transition">
                      <td className="p-3 text-gray-600 dir-ltr text-right">
                        {row.date} {row.time}
                      </td>
                      <td className="p-3 font-bold text-amber-700">{row.invoiceNo}</td>
                      <td className="p-3 font-semibold">{row.type}</td>
                      <td className="p-3 font-bold text-gray-900">{formatCurrency(row.total, lang)}</td>
                      <td className="p-3 text-emerald-600 font-bold">{formatCurrency(row.paid, lang)}</td>
                      <td className="p-3 font-black text-rose-600">{formatCurrency(row.balance, lang)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Statements Pagination Footer */}
          {totalRows > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/50 p-4 text-xs font-bold text-gray-500 select-none">
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
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>صفوف من أصل {totalRows} حركة مسجلّة</span>
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
        </div>
      ) : (
        <div className="py-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
          اختر اسماً من القائمة أعلى لعرض كشف الحساب بالتفصيل.
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
                  list="stmt-all-person-names"
                  placeholder="أدخل الاسم..."
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-sm font-bold focus:border-amber-500 focus:outline-none"
                />
                <datalist id="stmt-all-person-names">
                  {Array.from(
                    new Set([
                      ...sales.map((s) => s.customerName).filter(Boolean),
                      ...purchases.map((p) => p.supplierName).filter(Boolean),
                    ])
                  ).map((n, idx) => (
                    <option key={`stmt-dl-name-${n}-${idx}`} value={n} />
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
