import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShoppingCart,
  Plus,
  Trash2,
  Printer,
  Search,
  DollarSign,
  User,
  Phone,
  Building,
  Calendar,
  X,
  CreditCard,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { TransactionItem, SaleTransaction } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';
import { NumberInput } from '../common/NumberInput';

export const SalesView: React.FC = () => {
  const {
    sales,
    products,
    createSale,
    addSalePayment,
    softDeleteSale,
    restoreSale,
    openPrintModal,
    currentUser,
    t,
    lang,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState<SaleTransaction | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Invoice Creator State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCompany, setCustomerCompany] = useState('');
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [discount, setDiscount] = useState<number | string>('');
  const [paidAmount, setPaidAmount] = useState<number | string>('');
  const [notes, setNotes] = useState('');

  // Individual Payment State
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('نقداً');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Extract unique past customer names for quick suggest
  const customerSuggestions = Array.from(new Set(sales.map((s) => s.customerName).filter(Boolean)));

  const filteredSales = sales.filter((s) => {
    const matchesArchived = showArchived ? s.isDeleted : !s.isDeleted;
    const term = (searchTerm || '').toLowerCase();
    const matchesSearch =
      (s.invoiceNo || '').toLowerCase().includes(term) ||
      (s.customerName || '').toLowerCase().includes(term);
    return matchesArchived && matchesSearch;
  });

  // Reset pagination to page 1 when search term or archive view changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, showArchived]);

  // Calculate paginated slices
  const totalRows = filteredSales.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleAddItem = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const existingIdx = items.findIndex((i) => i.productId === productId);
    if (existingIdx >= 0) {
      const updated = [...items];
      updated[existingIdx].quantity += 1;
      updated[existingIdx].lineTotal = updated[existingIdx].quantity * updated[existingIdx].unitPrice;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          productId: prod.id,
          productName: prod.name,
          quantity: 1,
          unit: prod.unit,
          unitPrice: prod.sellingPrice,
          lineTotal: prod.sellingPrice,
          productionCostSnapshot: prod.effectiveProductionCost,
        },
      ]);
    }
  };

  const handleUpdateItemQty = (index: number, newQty: number) => {
    const updated = [...items];
    updated[index].quantity = Math.max(0.01, newQty);
    updated[index].lineTotal = updated[index].quantity * updated[index].unitPrice;
    setItems(updated);
  };

  const handleUpdateItemPrice = (index: number, newPrice: number) => {
    const updated = [...items];
    updated[index].unitPrice = Math.max(0, newPrice);
    updated[index].lineTotal = updated[index].quantity * updated[index].unitPrice;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const finalTotal = Math.max(0, subtotal - (Number(discount) || 0));

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    const createdSale = createSale({
      customerName: customerName || 'زبون عام',
      customerPhone,
      customerCompany,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      items,
      discount: Number(discount) || 0,
      paidAmount: Number(paidAmount) || 0,
      notes,
    });

    setShowInvoiceModal(false);
    // Reset form
    setCustomerName('');
    setCustomerPhone('');
    setCustomerCompany('');
    setItems([]);
    setDiscount('');
    setPaidAmount('');
    setNotes('');

    // Open print preview immediately for user convenience
    openPrintModal(`فاتورة مبيعات ${createdSale.invoiceNo}`, 'SALE', createdSale);
  };

  const handleAddPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPaymentModal || !paymentAmount) return;

    addSalePayment(showPaymentModal.id, Number(paymentAmount), paymentMethod, paymentNotes);
    setShowPaymentModal(null);
    setPaymentAmount('');
    setPaymentNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-xs border border-gray-100">
        <div>
          <h2 className="text-xl font-black text-gray-900">{t('sales')}</h2>
          <p className="text-xs text-gray-500">إصدار الفواتير المباشرة والبيع الآجل وإدارة المقبوضات</p>
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
              {showArchived ? 'الرجوع للمبيعات النشطة' : 'سجلات الأرشيف والمحذوفات'}
            </button>
          )}

          {currentUser?.permissions.manageSales && (
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-extrabold text-slate-950 shadow-md hover:bg-amber-600 transition"
            >
              <Plus className="h-4 w-4" />
              فاتورة مبيعات جديدة (POS)
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="بحث برقم الفاتورة أو اسم الزبون..."
          className="w-full rounded-xl border border-gray-200 bg-white py-2 pr-9 pl-3 text-sm focus:border-amber-500 focus:outline-none"
        />
      </div>

      {/* Sales Table */}
      <div className="rounded-2xl bg-white shadow-xs border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-gray-50 font-extrabold text-gray-600 border-b border-gray-200">
              <tr>
                <th className="p-3">{t('invoiceNo')}</th>
                <th className="p-3">{t('date')}</th>
                <th className="p-3">{t('customerName')}</th>
                <th className="p-3">المواد</th>
                <th className="p-3">{t('finalTotal')}</th>
                <th className="p-3">{t('paidAmount')}</th>
                <th className="p-3">{t('remainingDebt')}</th>
                <th className="p-3">المُنظّم</th>
                <th className="p-3">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-400 font-semibold">
                    لا توجد فواتير مبيعات مطابقة
                  </td>
                </tr>
              ) : (
                paginatedSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50/80 transition">
                    <td className="p-3 font-black text-amber-700">{sale.invoiceNo}</td>
                    <td className="p-3 text-gray-600">
                      {sale.date} <span className="text-[10px] text-gray-400">{sale.time}</span>
                    </td>
                    <td className="p-3 font-bold text-gray-900">
                      {sale.customerName}
                      {sale.customerPhone && (
                        <span className="block text-[10px] text-gray-400 font-medium">{sale.customerPhone}</span>
                      )}
                    </td>
                    <td className="p-3 text-gray-600">
                      {sale.items.length} مواد ({sale.items.map((i) => i.productName).join('، ')})
                    </td>
                    <td className="p-3 font-extrabold text-gray-900">{formatCurrency(sale.finalTotal, lang)}</td>
                    <td className="p-3 text-emerald-600 font-bold">{formatCurrency(sale.paidAmount, lang)}</td>
                    <td className="p-3">
                      {sale.debtAmount > 0 ? (
                        <span className="font-extrabold text-rose-600">{formatCurrency(sale.debtAmount, lang)}</span>
                      ) : (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">
                          خالص بالكامل
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-gray-500 font-semibold">@{sale.createdBy}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openPrintModal(`فاتورة ${sale.invoiceNo}`, 'SALE', sale)}
                          title="طباعة الوصل"
                          className="rounded-lg bg-amber-50 p-1.5 text-amber-700 hover:bg-amber-100"
                        >
                          <Printer className="h-4 w-4" />
                        </button>

                        {!sale.isDeleted && sale.debtAmount > 0 && (
                          <button
                            onClick={() => {
                              setShowPaymentModal(sale);
                              setPaymentAmount(sale.debtAmount);
                            }}
                            title="تسديد دفعة دين"
                            className="rounded-lg bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100"
                          >
                            <CreditCard className="h-4 w-4" />
                          </button>
                        )}

                        {!sale.isDeleted && currentUser?.permissions.deleteRecords && (
                          <button
                            onClick={() => setDeleteTargetId(sale.id)}
                            title="حذف مؤقت للأرشيف"
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}

                        {sale.isDeleted && currentUser?.permissions.restoreDeleted && (
                          <button
                            onClick={() => restoreSale(sale.id)}
                            title="استعادة الفاتورة"
                            className="rounded-lg bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-200 flex items-center gap-1"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            استعادة
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
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
              <span>صفوف من أصل {totalRows} فاتورة مبيعات</span>
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

      {/* Invoice Creator Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-lg font-bold text-gray-900">إنشاء فاتورة مبيعات جديدة</h3>
              <button onClick={() => setShowInvoiceModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="overflow-y-auto space-y-4 flex-1 pr-1">
              {/* Customer Auto-Suggest Header */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">{t('customerName')} *</label>
                  <input
                    type="text"
                    required
                    list="customer-names"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="مثال: أحمد الفضلي"
                    className="w-full rounded-lg border border-gray-300 p-2 text-xs font-semibold focus:border-amber-500 focus:outline-none"
                  />
                  <datalist id="customer-names">
                    {Array.from(new Set(customerSuggestions || [])).map((c, idx) => (
                      <option key={`cust-sug-${c}-${idx}`} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">{t('phone')}</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0770..."
                    className="w-full rounded-lg border border-gray-300 p-2 text-xs font-semibold focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">{t('company')}</label>
                  <input
                    type="text"
                    value={customerCompany}
                    onChange={(e) => setCustomerCompany(e.target.value)}
                    placeholder="شركة الدجلة..."
                    className="w-full rounded-lg border border-gray-300 p-2 text-xs font-semibold focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Product Picker */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">اختر منتج لإضافته للفاتورة:</label>
                <div className="flex flex-wrap gap-2">
                  {products
                    .filter((p) => p.isAvailable)
                    .map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => handleAddItem(p.id)}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-800 hover:border-amber-500 hover:bg-amber-50 transition shadow-2xs"
                      >
                        + {p.name} ({formatCurrency(p.sellingPrice, lang)})
                      </button>
                    ))}
                </div>
              </div>

              {/* Items Table */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                  <thead className="bg-amber-100/60 font-bold text-amber-900">
                    <tr>
                      <th className="p-2">المنتج</th>
                      <th className="p-2 w-28">الكمية</th>
                      <th className="p-2 w-32">سعر البيع</th>
                      <th className="p-2">الإجمالي</th>
                      <th className="p-2 w-10">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-gray-400">
                          لم يتم إضافة أي مواد بعد. انقر على المنتجات أعلاه لإضافتها.
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-bold text-gray-800">{item.productName}</td>
                          <td className="p-2">
                            <NumberInput
                              value={item.quantity}
                              onChange={(val) => handleUpdateItemQty(idx, parseFloat(val) || 0)}
                              className="w-full rounded border border-gray-300 p-1 text-xs font-bold"
                            />
                          </td>
                          <td className="p-2">
                            <NumberInput
                              value={item.unitPrice}
                              onChange={(val) => handleUpdateItemPrice(idx, parseFloat(val) || 0)}
                              className="w-full rounded border border-gray-300 p-1 text-xs font-bold text-emerald-700"
                            />
                          </td>
                          <td className="p-2 font-black text-gray-900">{formatCurrency(item.lineTotal, lang)}</td>
                          <td className="p-2">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-rose-500 hover:text-rose-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

              {/* Financial Calculation summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-500 block">{t('subtotal')}</span>
                  <span className="text-base font-black text-gray-900">{formatCurrency(subtotal, lang)}</span>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-0.5">{t('discount')} (د.ع)</label>
                  <NumberInput
                    placeholder="0"
                    value={discount}
                    onChange={(val) => setDiscount(val)}
                    className="w-full rounded-lg border border-gray-300 p-1.5 text-xs font-bold text-rose-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-0.5">{t('paidAmount')} (النقد المستلم)</label>
                  <NumberInput
                    placeholder="0"
                    value={paidAmount}
                    onChange={(val) => setPaidAmount(val)}
                    className="w-full rounded-lg border border-gray-300 p-1.5 text-xs font-bold text-emerald-700 bg-white"
                  />
                </div>

                <div>
                  <span className="text-gray-500 block">المتبقي دين مستحق</span>
                  <span className="text-base font-black text-rose-600">
                    {formatCurrency(Math.max(0, finalTotal - (Number(paidAmount) || 0)), lang)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={items.length === 0}
                  className="rounded-xl bg-amber-500 px-6 py-2 text-xs font-extrabold text-slate-950 shadow-md hover:bg-amber-600 disabled:opacity-50"
                >
                  حفظ الفاتورة وطباعتها
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Record Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-gray-900">
                تسديد دفعة على الفاتورة {showPaymentModal.invoiceNo}
              </h3>
              <button onClick={() => setShowPaymentModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddPaymentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">اسم الزبون</label>
                <p className="font-extrabold text-sm text-gray-900">{showPaymentModal.customerName}</p>
                <p className="text-rose-600 font-bold mt-1">
                  الدين المتبقي الحالي: {formatCurrency(showPaymentModal.debtAmount, lang)}
                </p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">المبلغ المسدد الآن (د.ع) *</label>
                <NumberInput
                  required
                  placeholder="0"
                  value={paymentAmount}
                  onChange={(val) => setPaymentAmount(val === '' ? '' : parseFloat(val))}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-sm font-bold text-emerald-700 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">طريقة الدفع</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs font-semibold focus:outline-none"
                >
                  <option value="نقداً">نقداً (كاش)</option>
                  <option value="تحويل بنكي / محفظة">تحويل بنكي / محفظة</option>
                  <option value="شيك">شيك مصرفي</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">ملاحظات التسديد</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(null)}
                  className="rounded-xl border border-gray-300 px-4 py-2 font-bold text-gray-700"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 font-extrabold text-white shadow-md hover:bg-emerald-700"
                >
                  تأكيد الدفعة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Soft Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        title={t('confirmDeleteTitle')}
        message={t('confirmDeleteMsg')}
        requireReason={true}
        onConfirm={(reason) => {
          if (deleteTargetId) {
            softDeleteSale(deleteTargetId, reason);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
