import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Printer, Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { PrintTemplate } from '../../types';

export const PrintTemplatesView: React.FC = () => {
  const { printTemplates, addPrintTemplate, updatePrintTemplate, deletePrintTemplate, t, lang } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PrintTemplate | null>(null);

  const [name, setName] = useState('');
  const [paperSize, setPaperSize] = useState<'A4' | 'A5'>('A4');
  const [headerNotes, setHeaderNotes] = useState('');
  const [footerNotes, setFooterNotes] = useState('');
  const [showLogo, setShowLogo] = useState(true);
  const [showCompanyDetails, setShowCompanyDetails] = useState(true);

  const handleOpenAdd = () => {
    setEditingTemplate(null);
    setName('قالب وصل جديد');
    setPaperSize('A4');
    setHeaderNotes('مرحباً بكم في شركتنا - نشكر تعاملكم معنا');
    setFooterNotes('البضاعة المباعة لا تُرد ولا تُستبدل بعد مضي 3 أيام من الشراء');
    setShowLogo(true);
    setShowCompanyDetails(true);
    setShowModal(true);
  };

  const handleOpenEdit = (tmpl: PrintTemplate) => {
    setEditingTemplate(tmpl);
    setName(tmpl.name);
    setPaperSize(tmpl.paperSize);
    setHeaderNotes(tmpl.headerNotes || '');
    setFooterNotes(tmpl.footerNotes || '');
    setShowLogo(tmpl.showLogo);
    setShowCompanyDetails(tmpl.showCompanyDetails);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTemplate) {
      updatePrintTemplate(editingTemplate.id, {
        name,
        paperSize,
        headerNotes,
        footerNotes,
        showLogo,
        showCompanyDetails,
      });
    } else {
      addPrintTemplate({
        name,
        paperSize,
        headerNotes,
        footerNotes,
        showLogo,
        showCompanyDetails,
        isDefault: false,
      });
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-xs border border-gray-100">
        <div>
          <h2 className="text-xl font-black text-gray-900">{t('printTemplates')}</h2>
          <p className="text-xs text-gray-500">تصميم وتخصيص قوالب طباعة الفواتير ووصولات القبض بأحجام A4 و A5</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-md hover:bg-amber-600"
        >
          <Plus className="h-4 w-4" />
          إضافة قالب طباعة جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {printTemplates.map((tmpl) => (
          <div key={tmpl.id} className="rounded-2xl bg-white p-5 shadow-xs border border-gray-200 hover:border-amber-400 transition">
            <div className="flex items-start justify-between">
              <div>
                <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  {tmpl.paperSize}
                </span>
                <h3 className="text-base font-extrabold text-gray-900 mt-1">{tmpl.name}</h3>
              </div>

              <div className="flex gap-1">
                <button onClick={() => handleOpenEdit(tmpl)} className="p-1.5 text-gray-400 hover:text-amber-600">
                  <Edit2 className="h-4 w-4" />
                </button>
                {printTemplates.length > 1 && (
                  <button onClick={() => deletePrintTemplate(tmpl.id)} className="p-1.5 text-gray-400 hover:text-rose-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-500 space-y-1 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <p><strong>ملاحظات الترويسة:</strong> {tmpl.headerNotes || '-'}</p>
              <p><strong>ملاحظات التذييل:</strong> {tmpl.footerNotes || '-'}</p>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-gray-900">
                {editingTemplate ? 'تعديل قالب الطباعة' : 'إنشاء قالب طباعة جديد'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">اسم القالب *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">حجم الورق المقاس</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaperSize('A4')}
                    className={`flex-1 py-2 rounded-xl font-bold border transition ${
                      paperSize === 'A4' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-gray-50 text-gray-600'
                    }`}
                  >
                    A4 قياسي
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaperSize('A5')}
                    className={`flex-1 py-2 rounded-xl font-bold border transition ${
                      paperSize === 'A5' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-gray-50 text-gray-600'
                    }`}
                  >
                    A5 مصغر
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">عبارة الترويسة (أعلى الوصل)</label>
                <input
                  type="text"
                  value={headerNotes}
                  onChange={(e) => setHeaderNotes(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">شروط وتذييل الوصل (أسفل الوصل)</label>
                <textarea
                  rows={2}
                  value={footerNotes}
                  onChange={(e) => setFooterNotes(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 font-bold text-gray-700"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 px-5 py-2 font-extrabold text-slate-950 hover:bg-amber-600"
                >
                  حفظ القالب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
