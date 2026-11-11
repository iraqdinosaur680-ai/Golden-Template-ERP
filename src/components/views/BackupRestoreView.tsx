import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Download, Upload, AlertTriangle } from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

export const BackupRestoreView: React.FC = () => {
  const { 
    exportBackupJSON, 
    importBackupJSON, 
    resetSystemData, 
    t,
  } = useApp();

  const [importStatus, setImportStatus] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonContent = event.target?.result as string;
        const success = importBackupJSON(jsonContent);
        if (success) {
          setImportStatus('تمت استعادة البيانات بنجاح تام وتحديث النظام!');
        } else {
          setImportStatus('فشل في استعادة البيانات! يرجى التأكد من أن الملف هو نسخة JSON صحيحة.');
        }
      } catch (err) {
        setImportStatus('ملف غير صالح!');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans" dir="rtl">
      <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-xs border border-gray-100">
        <div>
          <h2 className="text-xl font-black text-gray-900">{t('backup')}</h2>
          <p className="text-xs text-gray-500">تصدير واستعادة النسخ الاحتياطية لبيانات النظام كملف JSON محلي</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="rounded-2xl bg-white p-6 shadow-xs border border-gray-200 flex flex-col justify-between">
          <div>
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600 w-fit mb-4">
              <Download className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-black text-gray-900">حفظ وتصدير نسخة احتياطية (JSON)</h3>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              قم بتحميل كافة بيانات النظام الحالية (المنتجات، المبيعات، المشتريات، الديون، الموظفين، والمصاريف) كملف موحد آمن.
            </p>
          </div>

          <button
            onClick={exportBackupJSON}
            className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-extrabold text-slate-950 shadow-md hover:bg-amber-600 transition"
          >
            <Download className="h-4 w-4" />
            تصدير ملف النسخة الاحتياطية الآن
          </button>
        </div>

        {/* Import Card */}
        <div className="rounded-2xl bg-white p-6 shadow-xs border border-gray-200 flex flex-col justify-between">
          <div>
            <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600 w-fit mb-4">
              <Upload className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-black text-gray-900">استرجاع واستعادة نسخة احتياطية</h3>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              اختر ملف نسخة احتياطية سبق تصديره بصيغة JSON لاسترجاع قواعد البيانات بالكامل.
            </p>
          </div>

          <div className="mt-6">
            {importStatus && (
              <p className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-lg mb-3 border border-emerald-200 text-center">
                {importStatus}
              </p>
            )}

            <label className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-extrabold text-white shadow-md hover:bg-indigo-700 transition cursor-pointer">
              <Upload className="h-4 w-4" />
              اختيار ملف النسخة الاحتياطية (.json)
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Reset Card */}
      <div className="rounded-2xl bg-rose-50 p-6 border border-rose-200">
        <div className="flex items-start space-x-3 space-x-reverse">
          <div className="rounded-xl bg-rose-100 p-3 text-rose-600 shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-black text-rose-900">منطقة الإجراءات الخطيرة: إعادة ضبط بيانات المصنع</h3>
            <p className="text-xs text-rose-700 mt-1 leading-relaxed">
              سيؤدي هذا الإجراء إلى مسح وحذف كافة البيانات والمنتجات والفواتير والمصاريف والديون والرواتب بالكامل وتفريغ النظام دون توليد بيانات تجريبية. يُوصى بأخذ نسخة احتياطية أولاً.
            </p>

            <button
              onClick={() => setShowResetConfirm(true)}
              className="mt-4 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-rose-700 transition shadow-sm"
            >
              إعادة ضبط المصنع وحذف جميع البيانات
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showResetConfirm}
        title="تأكيد مسح كافة بيانات النظام (إعادة ضبط المصنع)"
        message="هل أنت متأكد تماماً من رغبتك في حذف ومسح كافة الفواتير والمنتجات والمصاريف والديون والرواتب نهائياً وتفريغ النظام؟ لا يمكن التراجع عن هذه الخطوة."
        requireReason={true}
        onConfirm={(reason) => {
          resetSystemData();
          setShowResetConfirm(false);
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};
