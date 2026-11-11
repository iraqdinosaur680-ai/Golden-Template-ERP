import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Printer, FileText, Check, FileCheck } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { PrintTemplate } from '../../types';

export const PrintPreviewModal: React.FC = () => {
  const { printModalConfig, closePrintModal, companySettings, printTemplates, t, lang } = useApp();
  const [selectedPaperSize, setSelectedPaperSize] = useState<'A4' | 'A5'>('A4');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(printTemplates[0]?.id || 'tmpl-a4');
  const [customHeader, setCustomHeader] = useState('');
  const [customFooter, setCustomFooter] = useState('');
  const [showSignature, setShowSignature] = useState(true);
  const [showStamp, setShowStamp] = useState(true);

  if (!printModalConfig.isOpen) return null;

  const activeTemplate = printTemplates.find((t) => t.id === selectedTemplateId) || printTemplates[0];

  const handlePrint = () => {
    window.print();
  };

  const data = printModalConfig.data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs">
      <div className="w-full max-w-4xl rounded-xl bg-white p-4 sm:p-6 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header toolbar */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{printModalConfig.title}</h3>
              <p className="text-xs text-gray-500">معاينة وتخصيص القالب قبل الطباعة الفعلية</p>
            </div>
          </div>
          <button
            onClick={closePrintModal}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Customization bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">{t('paperSize')}</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedPaperSize('A4')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-bold border transition ${
                  selectedPaperSize === 'A4'
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                A4 (قياسي)
              </button>
              <button
                type="button"
                onClick={() => setSelectedPaperSize('A5')}
                className={`flex-1 py-1.5 px-3 rounded-lg font-bold border transition ${
                  selectedPaperSize === 'A5'
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                A5 (مصغر)
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">اختيار القالب المصمم</label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 p-1.5 bg-white font-medium focus:outline-none"
            >
              {(printTemplates || []).map((tmpl, idx) => (
                <option key={`tmpl-${tmpl.id || idx}-${idx}`} value={tmpl.id}>
                  {tmpl.name} ({tmpl.paperSize})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-700">
              <input
                type="checkbox"
                checked={showSignature}
                onChange={(e) => setShowSignature(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              توقيع واستلام
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-700">
              <input
                type="checkbox"
                checked={showStamp}
                onChange={(e) => setShowStamp(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              مربع الختم
            </label>
          </div>

          <div className="flex items-end justify-end">
            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-600 py-2 px-4 text-sm font-bold text-white shadow-md hover:bg-amber-700 transition"
            >
              <Printer className="h-4 w-4" />
              طباعة فورية
            </button>
          </div>
        </div>

        {/* Printable Render Area */}
        <div className="flex-1 overflow-y-auto overflow-x-auto bg-gray-200 p-2 sm:p-4 rounded-xl">
          <div
            id="printable-document"
            className={`mx-auto bg-white p-8 shadow-md rounded-lg text-gray-900 border border-gray-200 ${
              selectedPaperSize === 'A5' ? 'max-w-[500px]' : 'max-w-[750px]'
            }`}
          >
            {/* Document Header */}
            <div className="flex items-center justify-between border-b-2 border-amber-500 pb-4 mb-6">
              <div>
                <h1 className="text-xl font-black text-amber-700">{companySettings.companyNameArabic}</h1>
                <p className="text-xs text-gray-600 font-medium">{companySettings.tagline}</p>
                <p className="text-xs text-gray-500">{companySettings.address} | هاتف: {companySettings.phone}</p>
              </div>
              <div className="text-left">
                <div className="inline-block rounded-lg bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 mb-1">
                  {printModalConfig.title}
                </div>
                <p className="text-xs text-gray-500 dir-ltr">{new Date().toLocaleString()}</p>
              </div>
            </div>

            {/* Custom Header notes */}
            {activeTemplate?.headerNotes && (
              <div className="mb-4 bg-amber-50/60 p-2.5 rounded-lg border border-amber-100 text-xs text-amber-900">
                {activeTemplate.headerNotes}
              </div>
            )}

            {/* Content Switcher based on Type */}
            {printModalConfig.type === 'SALE' && data && (
              <div>
                <div className="grid grid-cols-2 gap-4 text-xs mb-4 bg-gray-50 p-3 rounded-lg">
                  <div>
                    <span className="text-gray-500">{t('invoiceNo')}: </span>
                    <span className="font-bold text-gray-900">{data.invoiceNo}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('date')}: </span>
                    <span className="font-bold text-gray-900">{data.date} {data.time}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('customerName')}: </span>
                    <span className="font-bold text-gray-900">{data.customerName || 'زبون عام'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('phone')}: </span>
                    <span className="font-bold text-gray-900">{data.customerPhone || '-'}</span>
                  </div>
                </div>

                <table className="w-full text-right text-xs border-collapse mb-4">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 border-b border-gray-300">
                      <th className="p-2">#</th>
                      <th className="p-2">{t('productName')}</th>
                      <th className="p-2">{t('quantity')}</th>
                      <th className="p-2">{t('sellingPrice')}</th>
                      <th className="p-2">{t('finalTotal')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.items?.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2">{idx + 1}</td>
                        <td className="p-2 font-bold">{item.productName}</td>
                        <td className="p-2">{item.quantity} {item.unit}</td>
                        <td className="p-2">{formatCurrency(item.unitPrice, lang)}</td>
                        <td className="p-2 font-bold text-gray-900">{formatCurrency(item.lineTotal, lang)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end mb-4">
                  <div className="w-64 space-y-1 text-xs bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('subtotal')}:</span>
                      <span className="font-semibold">{formatCurrency(data.subtotal, lang)}</span>
                    </div>
                    {data.discount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>{t('discount')}:</span>
                        <span>-{formatCurrency(data.discount, lang)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-sm pt-1 border-t border-gray-300 text-gray-900">
                      <span>{t('finalTotal')}:</span>
                      <span>{formatCurrency(data.finalTotal, lang)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>{t('paidAmount')}:</span>
                      <span>{formatCurrency(data.paidAmount, lang)}</span>
                    </div>
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>{t('remainingDebt')}:</span>
                      <span>{formatCurrency(data.debtAmount, lang)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {printModalConfig.type === 'PURCHASE' && data && (
              <div>
                <div className="grid grid-cols-2 gap-4 text-xs mb-4 bg-gray-50 p-3 rounded-lg">
                  <div>
                    <span className="text-gray-500">{t('invoiceNo')}: </span>
                    <span className="font-bold text-gray-900">{data.invoiceNo}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('date')}: </span>
                    <span className="font-bold text-gray-900">{data.date} {data.time}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('supplierName')}: </span>
                    <span className="font-bold text-gray-900">{data.supplierName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('phone')}: </span>
                    <span className="font-bold text-gray-900">{data.supplierPhone || '-'}</span>
                  </div>
                </div>

                <table className="w-full text-right text-xs border-collapse mb-4">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 border-b border-gray-300">
                      <th className="p-2">#</th>
                      <th className="p-2">{t('productName')}</th>
                      <th className="p-2">{t('quantity')}</th>
                      <th className="p-2">{t('purchasePrice')}</th>
                      <th className="p-2">{t('finalTotal')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.items?.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2">{idx + 1}</td>
                        <td className="p-2 font-bold">{item.productName}</td>
                        <td className="p-2">{item.quantity} {item.unit}</td>
                        <td className="p-2">{formatCurrency(item.unitPrice, lang)}</td>
                        <td className="p-2 font-bold text-gray-900">{formatCurrency(item.lineTotal, lang)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end mb-4">
                  <div className="w-64 space-y-1 text-xs bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex justify-between font-black text-sm text-gray-900">
                      <span>{t('finalTotal')}:</span>
                      <span>{formatCurrency(data.finalTotal, lang)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>{t('paidAmount')}:</span>
                      <span>{formatCurrency(data.paidAmount, lang)}</span>
                    </div>
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>{t('remainingDebt')}:</span>
                      <span>{formatCurrency(data.debtAmount, lang)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {printModalConfig.type === 'STATEMENT' && data && (
              <div>
                <div className="bg-gray-50 p-3 rounded-lg mb-4 text-xs space-y-1">
                  <p><span className="text-gray-500">اسم الحساب: </span> <strong className="text-gray-900 text-sm">{data.personName}</strong></p>
                  <p><span className="text-gray-500">الهاتف والشركة: </span> {data.phone} {data.companyName ? `(${data.companyName})` : ''}</p>
                  <p><span className="text-gray-500">نوع الحساب: </span> {data.type === 'CUSTOMER' ? 'زبون (مبيعات)' : 'مورد (مشتريات)'}</p>
                </div>

                <table className="w-full text-right text-xs border-collapse mb-4">
                  <thead>
                    <tr className="bg-amber-100 text-amber-900 border-b border-amber-300 font-bold">
                      <th className="p-2">التاريخ</th>
                      <th className="p-2">رقم الحركة</th>
                      <th className="p-2">النوع</th>
                      <th className="p-2">المبلغ الكلي</th>
                      <th className="p-2">المدفوع</th>
                      <th className="p-2">الرصيد المتبقي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.history?.map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-2">{row.date}</td>
                        <td className="p-2 font-bold">{row.invoiceNo}</td>
                        <td className="p-2">{row.type}</td>
                        <td className="p-2 font-semibold">{formatCurrency(row.total, lang)}</td>
                        <td className="p-2 text-emerald-700">{formatCurrency(row.paid, lang)}</td>
                        <td className="p-2 font-black text-rose-700">{formatCurrency(row.balance, lang)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Custom Footer / Signatures */}
            {activeTemplate?.footerNotes && (
              <p className="text-center text-xs text-gray-500 mt-6 pt-4 border-t border-gray-200">
                {activeTemplate.footerNotes}
              </p>
            )}

            <div className="mt-8 pt-6 grid grid-cols-2 gap-8 text-center text-xs text-gray-700">
              {showSignature && (
                <div>
                  <p className="font-bold mb-8">توقيع مسؤول المبيعات / المحاسب</p>
                  <div className="border-b border-gray-400 w-36 mx-auto"></div>
                </div>
              )}
              {showStamp && (
                <div>
                  <p className="font-bold mb-2">ختم الشركة الرسمي</p>
                  <div className="h-16 w-32 border-2 border-dashed border-gray-300 rounded-lg mx-auto flex items-center justify-center text-gray-300 text-[10px]">
                    موقع الختم
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
