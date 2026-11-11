import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ReceiptText,
  Plus,
  Trash2,
  Search,
  SlidersHorizontal,
  X,
  RotateCcw,
  Zap,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Expense } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';
import { NumberInput } from '../common/NumberInput';

export const ExpensesView: React.FC = () => {
  const {
    expenses,
    addExpense,
    softDeleteExpense,
    restoreExpense,
    expenseCategories,
    addExpenseCategory,
    currentUser,
    t,
    lang,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState(expenseCategories[0] || 'مصاريف عامة');
  const [customCategory, setCustomCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('نقداً');
  const [recipient, setRecipient] = useState('');
  const [notes, setNotes] = useState('');

  const filteredExpenses = expenses.filter((e) => {
    const matchesArchived = showArchived ? e.isDeleted : !e.isDeleted;
    const matchesCategory = selectedCategory === 'ALL' || e.category === selectedCategory;
    const term = (searchTerm || '').toLowerCase();
    const matchesSearch =
      (e.title || '').toLowerCase().includes(term) ||
      (e.recipient ? e.recipient.toLowerCase().includes(term) : false);
    return matchesArchived && matchesCategory && matchesSearch;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, showArchived]);

  const totalRows = filteredExpenses.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    let finalCat = category;
    if (category === '__CUSTOM__' && customCategory.trim()) {
      finalCat = customCategory.trim();
      addExpenseCategory(finalCat);
    }

    addExpense({
      title,
      description: title,
      amount: Number(amount),
      category: finalCat,
      date: new Date().toISOString().split('T')[0],
      paymentMethod,
      recipient,
      notes,
    });

    setShowFormModal(false);
    setTitle('');
    setAmount('');
    setRecipient('');
    setNotes('');
  };

  const totalFilteredAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-xs border border-gray-100">
        <div>
          <h2 className="text-xl font-black text-gray-900">{t('expenses')}</h2>
          <p className="text-xs text-gray-500">تسجيل المصاريف التشغيلية والخدمية ورواتب العمال ومتابعة إنفاق المؤسسة</p>
        </div>

        <div className="flex items-center gap-3">
          {currentUser?.permissions.restoreDeleted && (
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition border ${
                showArchived
                  ? 'bg-rose-500 text-white border-rose-500'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
              }`}
            >
              {showArchived ? 'الرجوع للمصاريف النشطة' : 'الأرشيف والمحذوفات'}
            </button>
          )}

          {currentUser?.permissions.manageExpenses && (
            <button
              onClick={() => setShowFormModal(true)}
              className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-md hover:bg-rose-700 transition"
            >
              <Plus className="h-4 w-4" />
              تسجيل مصروف جديد
            </button>
          )}
        </div>
      </div>

      {/* Auto Service Calculation Banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 flex items-center justify-between text-xs text-amber-900 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-amber-500 p-1.5 text-slate-950 font-black">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <span className="font-black text-amber-950">احتساب خدمات المكونات التلقائية:</span>
            <span className="mr-1 text-amber-800">
              عند إضافة أي مكون تكلفة للمنتج (مثل الكهرباء والرواتب)، يتم تسجيله تلقائياً هنا في المصاريف والخدمات وحسابه فوراً مع كل عملية بيع (مثلاً: 5 قطع = 5 د.ع للكهرباء تلقائياً).
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث في عنوان المصروف أو المستلم..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pr-9 pl-3 text-sm focus:border-rose-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white py-2 px-3 text-sm focus:border-rose-500 focus:outline-none font-medium"
          >
            <option value="ALL">جميع التصنيفات</option>
            {Array.from(new Set(expenseCategories || [])).map((c, idx) => (
              <option key={`exp-cat-flt-${c}-${idx}`} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="rounded-2xl bg-white shadow-xs border border-gray-100 overflow-hidden">
        <div className="p-4 bg-rose-50/50 border-b border-rose-100 flex items-center justify-between">
          <span className="text-xs font-bold text-rose-900">مجموع المصاريف المعروضة:</span>
          <span className="text-lg font-black text-rose-700">{formatCurrency(totalFilteredAmount, lang)}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-gray-50 font-extrabold text-gray-600 border-b border-gray-200">
              <tr>
                <th className="p-3">التاريخ</th>
                <th className="p-3">عنوان المصروف</th>
                <th className="p-3">التصنيف</th>
                <th className="p-3">المبلغ</th>
                <th className="p-3">طريقة الدفع</th>
                <th className="p-3">المستلم / الجهة</th>
                <th className="p-3">المُسجّل</th>
                <th className="p-3">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400 font-semibold">
                    لا توجد مصاريف مطابقة
                  </td>
                </tr>
              ) : (
                paginatedExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50/80 transition">
                    <td className="p-3 text-gray-600">{exp.date}</td>
                    <td className="p-3 font-bold text-gray-900">{exp.category || exp.title || exp.description}</td>
                    <td className="p-3">
                      <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-3 font-black text-rose-600">{formatCurrency(exp.amount, lang)}</td>
                    <td className="p-3 text-gray-600">
                      {exp.paymentMethod === 'تلقائي من المبيعات' ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-900 border border-amber-300">
                          <Zap className="h-3 w-3 text-amber-600" />
                          احتساب تلقائي للمبيعات
                        </span>
                      ) : (
                        exp.paymentMethod
                      )}
                    </td>
                    <td className="p-3 font-semibold text-gray-700">{exp.recipient || '-'}</td>
                    <td className="p-3 text-gray-500">@{exp.createdBy}</td>
                    <td className="p-3">
                      {!exp.isDeleted && currentUser?.permissions.deleteRecords && (
                        <button
                          onClick={() => setDeleteTargetId(exp.id)}
                          title="حذف"
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      {exp.isDeleted && currentUser?.permissions.restoreDeleted && (
                        <button
                          onClick={() => restoreExpense(exp.id)}
                          className="rounded-lg bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-800 flex items-center gap-1"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          استعادة
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Expenses Pagination Footer */}
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
              <span>صفوف من أصل {totalRows} مصروف مسجّل</span>
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

      {/* Add Expense Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-lg font-bold text-gray-900">تسجيل مصروف جديد</h3>
              <button onClick={() => setShowFormModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">عنوان / وصف المصروف *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فاتورة كهرباء شهر 7 أو نفقات وقود"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-sm font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">المبلغ (د.ع) *</label>
                  <NumberInput
                    required
                    placeholder="0"
                    value={amount}
                    onChange={(val) => setAmount(val === '' ? '' : parseFloat(val))}
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-sm font-bold text-rose-600 focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">التصنيف *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-xs font-semibold focus:outline-none"
                  >
                    {Array.from(new Set(expenseCategories || [])).map((c, idx) => (
                      <option key={`exp-cat-modal-${c}-${idx}`} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ إضافة تصنيف جديد...</option>
                  </select>

                  {category === '__CUSTOM__' && (
                    <input
                      type="text"
                      placeholder="اكتب اسم التصنيف الجديد..."
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-rose-400 p-2 text-xs focus:outline-none"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">طريقة الصرف</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-xs font-semibold focus:outline-none"
                  >
                    <option value="نقداً">نقداً (كاش)</option>
                    <option value="تحويل بنكي">تحويل بنكي</option>
                    <option value="شيك">شيك</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">الجهة / المستلم</label>
                  <input
                    type="text"
                    placeholder="مثال: دائر الكهرباء / سائق الشاحنة"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">ملاحظات إضافية</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 font-bold text-gray-700"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-rose-600 px-6 py-2 font-extrabold text-white shadow-md hover:bg-rose-700"
                >
                  حفظ المصروف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        title={t('confirmDeleteTitle')}
        message={t('confirmDeleteMsg')}
        requireReason={true}
        onConfirm={(reason) => {
          if (deleteTargetId) {
            softDeleteExpense(deleteTargetId, reason);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
