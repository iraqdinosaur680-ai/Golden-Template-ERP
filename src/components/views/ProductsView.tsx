import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Search,
  SlidersHorizontal,
  DollarSign,
  History,
  X,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Calculator,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Product, CostComponent } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';
import { NumberInput } from '../common/NumberInput';

export const ProductsView: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductAvailability,
    setProductCostOverride,
    customUnits,
    addCustomUnit,
    addExpenseCategory,
    expenseCategories,
    inventoryMovements,
    currentUser,
    t,
    lang,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('ALL');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(12);

  // History inspection modal
  const [inspectHistoryProduct, setInspectHistoryProduct] = useState<Product | null>(null);

  // Soft delete confirm modal
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    unit: 'قطعة',
    customUnitInput: '',
    quantity: '' as number | string,
    minStock: '' as number | string,
    purchasePrice: '' as number | string,
    sellingPrice: '' as number | string,
    notes: '',
    isAvailable: true,
    productionCostComponents: [] as (Omit<CostComponent, 'amount'> & { amount: number | string })[],
    manualProductionCostOverride: '' as number | string | null,
    enableManualOverride: false,
  });

  const [newComponentName, setNewComponentName] = useState('');
  const [newComponentAmount, setNewComponentAmount] = useState<number | string>('');

  const filteredProducts = products.filter((p) => {
    const term = (searchTerm || '').toLowerCase();
    const matchesSearch =
      (p.name || '').toLowerCase().includes(term) ||
      (p.sku || '').toLowerCase().includes(term);
    const matchesUnit = selectedUnitFilter === 'ALL' || p.unit === selectedUnitFilter;
    return matchesSearch && matchesUnit;
  });

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedUnitFilter]);

  const totalRows = filteredProducts.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    const defaultUnit = customUnits && customUnits.length > 0 ? customUnits[0] : '';
    setFormData({
      name: '',
      sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000),
      unit: defaultUnit || '',
      customUnitInput: '',
      quantity: '',
      minStock: '',
      purchasePrice: '',
      sellingPrice: '',
      notes: '',
      isAvailable: true,
      productionCostComponents: [],
      manualProductionCostOverride: '',
      enableManualOverride: false,
    });
    setShowFormModal(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      unit: p.unit,
      customUnitInput: '',
      quantity: p.quantity,
      minStock: p.minStock,
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
      notes: p.notes || '',
      isAvailable: p.isAvailable,
      productionCostComponents: p.productionCostComponents || [],
      manualProductionCostOverride: p.manualProductionCostOverride ?? '',
      enableManualOverride: p.manualProductionCostOverride !== null && p.manualProductionCostOverride !== undefined,
    });
    setShowFormModal(true);
  };

  const handleAddCostComponent = () => {
    if (!newComponentName || newComponentAmount === '') return;
    const trimmedName = newComponentName.trim();
    const newComp = {
      id: 'comp-' + Date.now(),
      name: trimmedName,
      amount: newComponentAmount,
    };
    setFormData((prev) => ({
      ...prev,
      productionCostComponents: [...prev.productionCostComponents, newComp],
    }));
    addExpenseCategory(trimmedName);
    setNewComponentName('');
    setNewComponentAmount('');
  };

  const handleUpdateComponentAmount = (id: string, newAmount: number | string) => {
    setFormData((prev) => ({
      ...prev,
      productionCostComponents: prev.productionCostComponents.map((c) =>
        c.id === id ? { ...c, amount: newAmount } : c
      ),
    }));
  };

  const handleRemoveCostComponent = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      productionCostComponents: prev.productionCostComponents.filter((c) => c.id !== id),
    }));
  };

  const availableServiceCategories = Array.from(
    new Set(expenseCategories || [])
  ).filter(Boolean);

  const calculateAutoCost = () => {
    return formData.productionCostComponents.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    const finalUnit = (formData.unit === '__CUSTOM__' ? formData.customUnitInput : formData.unit).trim() || 'وحدة';
    addCustomUnit(finalUnit);

    const calculatedCost = calculateAutoCost();
    const override = formData.enableManualOverride && formData.manualProductionCostOverride !== '' && formData.manualProductionCostOverride !== null
      ? Number(formData.manualProductionCostOverride)
      : null;

    const finalComponents: CostComponent[] = formData.productionCostComponents.map((c) => ({
      id: c.id,
      name: c.name,
      amount: Number(c.amount) || 0,
    }));

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: formData.name,
        sku: formData.sku,
        unit: finalUnit,
        quantity: Number(formData.quantity) || 0,
        minStock: Number(formData.minStock) || 0,
        purchasePrice: Number(formData.purchasePrice) || 0,
        sellingPrice: Number(formData.sellingPrice) || 0,
        notes: formData.notes,
        isAvailable: formData.isAvailable,
        productionCostComponents: finalComponents,
        manualProductionCostOverride: override,
      });
    } else {
      addProduct({
        name: formData.name,
        sku: formData.sku,
        unit: finalUnit,
        quantity: Number(formData.quantity) || 0,
        minStock: Number(formData.minStock) || 0,
        purchasePrice: Number(formData.purchasePrice) || 0,
        sellingPrice: Number(formData.sellingPrice) || 0,
        notes: formData.notes,
        isAvailable: formData.isAvailable,
        productionCostComponents: finalComponents,
        manualProductionCostOverride: override,
      });
    }

    setShowFormModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-xs border border-gray-100">
        <div>
          <h2 className="text-xl font-black text-gray-900">{t('products')}</h2>
          <p className="text-xs text-gray-500">إدارة دليل المنتجات وتكلفة التصنيع وتتبع حركة المخزون</p>
        </div>

        {currentUser?.permissions.manageProducts && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-md hover:bg-amber-600 transition"
          >
            <Plus className="h-4 w-4" />
            {t('add')} منتج جديد
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث باسم المنتج أو الرمز SKU..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pr-9 pl-3 text-sm focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-gray-400" />
          <select
            value={selectedUnitFilter}
            onChange={(e) => setSelectedUnitFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white py-2 px-3 text-sm focus:border-amber-500 focus:outline-none font-medium"
          >
            <option value="ALL">{t('all')} الوحدات</option>
            {Array.from(new Set(customUnits || [])).map((u, idx) => (
              <option key={`unit-flt-${u}-${idx}`} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid / Cards */}
      {paginatedProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center text-gray-400 font-semibold">
          لا توجد منتجات مطابقة لخيارات البحث الحالية
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedProducts.map((p) => {
              const autoCost = p.calculatedProductionCost || 0;
              const isOverridden = p.manualProductionCostOverride !== null && p.manualProductionCostOverride !== undefined;
              const effectiveCost = isOverridden ? p.manualProductionCostOverride! : autoCost;
              const baseCost = effectiveCost > 0 ? effectiveCost : p.purchasePrice;
              const profitPerUnit = p.sellingPrice - baseCost;
              const profitMargin = p.sellingPrice > 0 ? ((profitPerUnit / p.sellingPrice) * 100).toFixed(1) : '0';

              return (
                <div
                  key={p.id}
                  className={`rounded-2xl bg-white p-5 shadow-xs border transition flex flex-col justify-between ${
                    !p.isAvailable ? 'opacity-75 border-gray-300 bg-gray-50/80' : 'border-gray-200 hover:border-amber-400'
                  }`}
                >
                  <div>
                    {/* Card Title & Status */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="inline-block rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600 mb-1">
                          {p.sku}
                        </span>
                        <h3 className="text-base font-extrabold text-gray-900 leading-snug">{p.name}</h3>
                      </div>

                      <button
                        onClick={() => toggleProductAvailability(p.id)}
                        title="تغيير حالة التوفر للمبيعات"
                        className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          p.isAvailable
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        {p.isAvailable ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            {t('available')}
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3" />
                            {t('unavailable')}
                          </>
                        )}
                      </button>
                    </div>

                    {/* Stock Quantity */}
                    <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-50 p-3 border border-gray-100">
                      <span className="text-xs font-bold text-gray-500">{t('quantity')}:</span>
                      <div className="text-left">
                        <span
                          className={`text-lg font-black ${
                            p.quantity <= p.minStock ? 'text-rose-600' : 'text-gray-900'
                          }`}
                        >
                          {formatNumber(p.quantity, lang)} {p.unit}
                        </span>
                        {p.quantity <= p.minStock && (
                          <span className="block text-[10px] font-bold text-rose-500">منخفض (أقل من {p.minStock})</span>
                        )}
                      </div>
                    </div>

                    {/* Production Cost Breakdown */}
                    <div className="mt-3 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-gray-600">
                        <span>تكلفة الإنتاج:</span>
                        <span className="font-bold text-gray-900">
                          {formatCurrency(effectiveCost, lang)}
                          {isOverridden && (
                            <span className="mr-1 text-[10px] text-amber-600 font-bold">(يدوي)</span>
                          )}
                        </span>
                      </div>

                      {p.productionCostComponents && p.productionCostComponents.length > 0 && (
                        <div className="rounded-lg bg-amber-50/50 p-2 text-[11px] border border-amber-100">
                          <p className="font-bold text-amber-900 mb-1">تفاصيل التكلفة ({p.productionCostComponents.length} عناصر):</p>
                          <div className="flex flex-wrap gap-1">
                            {p.productionCostComponents.map((c) => (
                              <span key={c.id} className="rounded bg-white px-1.5 py-0.5 border border-amber-200 text-gray-700">
                                {c.name}: {formatCurrency(c.amount, lang)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-gray-600 pt-1">
                        <span>سعر البيع المقترح:</span>
                        <span className="font-extrabold text-emerald-700 text-sm">
                          {formatCurrency(p.sellingPrice, lang)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[11px] pt-1 border-t border-gray-100">
                        <span className="text-gray-500">هامش الربح / وحدة:</span>
                        <span className="font-bold text-indigo-700">
                          +{formatCurrency(profitPerUnit, lang)} ({profitMargin}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-5 flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                    <button
                      onClick={() => setInspectHistoryProduct(p)}
                      className="flex items-center gap-1 text-gray-500 hover:text-indigo-600 font-semibold"
                    >
                      <History className="h-3.5 w-3.5" />
                      حركة المخزون
                    </button>

                    {currentUser?.permissions.manageProducts && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-amber-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(p.id)}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
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
                <span>منتجات من أصل {totalRows} منتج متاح</span>
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

      {/* Add / Edit Product Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {editingProduct ? `${t('edit')} بيانات المنتج` : `${t('add')} منتج جديد`}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="overflow-y-auto space-y-4 flex-1 pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('productName')} *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-sm font-semibold focus:border-amber-500 focus:outline-none"
                    placeholder="مثال: عبوة عصير برتقال 1 لتر"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('sku')} *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku || ''}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-sm font-semibold focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('unit')} *</label>
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      list="customUnitsList"
                      required
                      placeholder="اكتب وحدة القياس (مثال: قطعة، كرتون، لتر...)"
                      value={(formData.unit === '__CUSTOM__' ? formData.customUnitInput : formData.unit) || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({
                          ...formData,
                          unit: val,
                          customUnitInput: val,
                        });
                      }}
                      className="w-full rounded-xl border border-gray-300 p-2.5 text-sm font-semibold focus:border-amber-500 focus:outline-none bg-white"
                    />
                    {customUnits && customUnits.length > 0 && (
                      <datalist id="customUnitsList">
                        {Array.from(new Set(customUnits)).map((u, idx) => (
                          <option key={`unit-dl-${u}-${idx}`} value={u} />
                        ))}
                      </datalist>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('quantity')} الحالية</label>
                  <NumberInput
                    placeholder="0"
                    value={formData.quantity}
                    onChange={(val) => setFormData({ ...formData, quantity: val })}
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-sm font-semibold focus:border-amber-500 focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('minStock')}</label>
                  <NumberInput
                    placeholder="0"
                    value={formData.minStock}
                    onChange={(val) => setFormData({ ...formData, minStock: val })}
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-sm font-semibold focus:border-amber-500 focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('sellingPrice')} (د.ع)</label>
                  <NumberInput
                    placeholder="0"
                    value={formData.sellingPrice}
                    onChange={(val) => setFormData({ ...formData, sellingPrice: val })}
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-sm font-bold text-emerald-700 focus:border-amber-500 focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t('purchasePrice')} (للمشتريات فقط)</label>
                  <NumberInput
                    placeholder="0"
                    value={formData.purchasePrice}
                    onChange={(val) => setFormData({ ...formData, purchasePrice: val })}
                    className="w-full rounded-xl border border-gray-300 p-2.5 text-sm font-semibold focus:border-amber-500 focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Dynamic Production Cost Breakdown */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-amber-600" />
                    <h4 className="font-extrabold text-gray-900 text-sm">{t('costComponents')}</h4>
                  </div>
                  <span className="text-xs font-black text-amber-800 bg-amber-100 px-2 py-1 rounded-md border border-amber-300">
                    المجموع المحسوب: {formatCurrency(calculateAutoCost(), lang)}
                  </span>
                </div>

                {/* List of components with inline price editing */}
                <div className="space-y-2">
                  {formData.productionCostComponents.length === 0 ? (
                    <p className="text-xs text-amber-800/70 italic bg-white/60 p-2.5 rounded-lg border border-amber-200/60 text-center">
                      لم يتم إضافة عناصر تكلفة لهذا المنتج بعد.
                    </p>
                  ) : (
                    formData.productionCostComponents.map((comp) => (
                      <div key={comp.id} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-amber-200 text-xs shadow-2xs">
                        <div className="flex items-center gap-2 font-black text-gray-800">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span>{comp.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500 font-bold">التكلفة/وحدة:</span>
                          <NumberInput
                            placeholder="0"
                            value={comp.amount}
                            onChange={(val) => handleUpdateComponentAmount(comp.id, val)}
                            className="w-24 rounded-lg border border-amber-300 bg-white p-1 text-center font-black text-gray-900 focus:border-amber-600 focus:bg-white focus:outline-none"
                          />
                          <span className="text-[10px] font-bold text-gray-500">د.ع</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCostComponent(comp.id)}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition"
                            title="حذف المكون"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Quick Selection Chips for Services/Expenses - only if user added any */}
                {availableServiceCategories.length > 0 && (
                  <div className="pt-2 border-t border-amber-200 space-y-1.5">
                    <span className="text-[11px] font-black text-amber-900 block">
                      التصنيفات المضافة:
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {availableServiceCategories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setNewComponentName(cat)}
                          className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition flex items-center gap-1 ${
                            newComponentName === cat
                              ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                              : 'bg-white text-gray-800 border-amber-300 hover:bg-amber-100 hover:text-amber-950'
                          }`}
                        >
                          <span>+</span>
                          <span>{cat}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add component form */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    list="serviceCategoryDatalist"
                    placeholder="اسم عنصر التكلفة..."
                    value={newComponentName}
                    onChange={(e) => setNewComponentName(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 p-2 text-xs focus:outline-none focus:border-amber-500 bg-white font-medium"
                  />
                  {availableServiceCategories.length > 0 && (
                    <datalist id="serviceCategoryDatalist">
                      {availableServiceCategories.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  )}

                  <NumberInput
                    placeholder="المبلغ (د.ع/وحدة)"
                    value={newComponentAmount}
                    onChange={(val) => setNewComponentAmount(val)}
                    className="w-32 rounded-lg border border-gray-300 p-2 text-xs focus:outline-none focus:border-amber-500 bg-white font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleAddCostComponent}
                    className="rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-700 transition"
                  >
                    إضافة
                  </button>
                </div>

                {/* Manual Override Section */}
                <div className="pt-3 border-t border-amber-200 flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800">
                    <input
                      type="checkbox"
                      checked={formData.enableManualOverride}
                      onChange={(e) => setFormData({ ...formData, enableManualOverride: e.target.checked })}
                      className="rounded text-amber-600"
                    />
                    تفعيل التعديل والتجاوز اليدوي للتكلفة الإجمالية
                  </label>

                  {formData.enableManualOverride && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 font-medium">التكلفة اليدوية:</span>
                      <NumberInput
                        placeholder="0"
                        value={formData.manualProductionCostOverride ?? ''}
                        onChange={(val) =>
                          setFormData({
                            ...formData,
                            manualProductionCostOverride: val,
                          })
                        }
                        className="w-32 rounded-lg border border-amber-500 bg-white p-1.5 text-xs font-bold text-amber-900 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">{t('notes')}</label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 p-2 text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-extrabold text-slate-950 shadow-md hover:bg-amber-600"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock History Inspection Modal */}
      {inspectHistoryProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">
                  سجل حركة المخزون - {inspectHistoryProduct.name}
                </h3>
                <p className="text-xs text-gray-500">الكمية الحالية: {inspectHistoryProduct.quantity} {inspectHistoryProduct.unit}</p>
              </div>
              <button onClick={() => setInspectHistoryProduct(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <table className="w-full text-right text-xs">
                <thead className="bg-gray-100 font-bold text-gray-600 sticky top-0">
                  <tr>
                    <th className="p-2.5">التاريخ</th>
                    <th className="p-2.5">نوع الحركة</th>
                    <th className="p-2.5">الكمية</th>
                    <th className="p-2.5">رقم المرجع</th>
                    <th className="p-2.5">المستخدم</th>
                    <th className="p-2.5">تفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inventoryMovements
                    .filter((m) => m.productId === inspectHistoryProduct.id)
                    .map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="p-2.5 text-gray-600">{m.date}</td>
                        <td className="p-2.5 font-bold">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] ${
                              m.type === 'PURCHASE' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {m.type === 'PURCHASE' ? 'شراء وتوريد (+)' : 'بيع لصالح زبون (-)'}
                          </span>
                        </td>
                        <td className="p-2.5 font-black">{m.quantity} {m.unit}</td>
                        <td className="p-2.5 font-bold text-amber-700">{m.referenceNo || '-'}</td>
                        <td className="p-2.5 text-gray-600">@{m.username}</td>
                        <td className="p-2.5 text-gray-500">{m.notes}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
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
            deleteProduct(deleteTargetId, reason);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
