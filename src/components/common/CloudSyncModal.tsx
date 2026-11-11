import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Cloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Smartphone,
  Globe,
  Database,
  ExternalLink,
  ShieldCheck,
  QrCode,
  X,
  Radio,
  Server
} from 'lucide-react';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ isOpen, onClose }) => {
  const {
    firebaseActive,
    syncKey,
    setSyncKey,
    triggerCloudPush,
    triggerCloudPull,
    lastCloudSyncTime,
    cloudSyncStatus,
    testCloudConnection,
  } = useApp();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs: number; message: string } | null>(null);
  const [customKeyInput, setCustomKeyInput] = useState(syncKey);
  const [isEditingKey, setIsEditingKey] = useState(false);

  if (!isOpen) return null;

  // Build the direct mobile link with syncKey parameter
  const mobileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?syncKey=${encodeURIComponent(syncKey)}`
    : '';

  // Generate QR Code URL using public safe QR API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mobileUrl)}&bgcolor=ffffff&color=0f172a&margin=6`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(mobileUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(syncKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleManualPush = async () => {
    setIsSyncingNow(true);
    await triggerCloudPush();
    setIsSyncingNow(false);
  };

  const handleManualPull = async () => {
    if (confirm('هل تريد استيراد أحدث بيانات الشركة المحفوظة على السحابة الآن؟')) {
      setIsSyncingNow(true);
      await triggerCloudPull();
      setIsSyncingNow(false);
    }
  };

  const handleRunTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testCloudConnection();
    setTestResult(res);
    setIsTesting(false);
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (customKeyInput.trim()) {
      setSyncKey(customKeyInput.trim());
      setIsEditingKey(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-4 backdrop-blur-xs font-sans" dir="rtl">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-black shadow-md">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                المزامنة السحابية وقاعدة بيانات Firestore
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  مباشر Real-time
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                مزامنة فورية لكل المنتجات، المبيعات، الموظفين، والمستخدمين عبر الهاتف والكمبيوتر ومن أي دولة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
          
          {/* Status Banner */}
          <div className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
            firebaseActive 
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-amber-50/70 border-amber-200 text-amber-950'
          }`}>
            <div className="flex items-center gap-3.5">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                firebaseActive ? 'bg-emerald-600 text-white shadow-sm' : 'bg-amber-500 text-slate-950'
              }`}>
                {firebaseActive ? <CheckCircle2 className="h-6 w-6" /> : <AlertCircle className="h-6 w-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black">
                    {firebaseActive ? 'قاعدة بيانات Firestore متصلة وتعمل بنجاح' : 'جاري تهيئة الاتصال بالسحابة'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {lastCloudSyncTime ? `آخر مزامنة وتحديث تلقائي: ${lastCloudSyncTime}` : 'يتم حفظ أي تعديل تلقائياً في السحابة خلال ثوانٍ'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRunTest}
                disabled={isTesting}
                className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-800 border border-slate-200 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
              >
                <Server className={`h-3.5 w-3.5 text-amber-600 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'جاري الفحص...' : 'فحص الاتصال بقاعدة البيانات'}</span>
              </button>

              <button
                onClick={handleManualPush}
                disabled={isSyncingNow}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-black text-slate-950 shadow-sm hover:bg-amber-600 transition cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncingNow ? 'animate-spin' : ''}`} />
                <span>{isSyncingNow ? 'جاري المزامنة...' : 'مزامنة وحفظ فوري'}</span>
              </button>
            </div>
          </div>

          {/* Test connection result banner */}
          {testResult && (
            <div className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs font-bold ${
              testResult.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {testResult.success ? <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" /> : <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Connect Your Phone Section */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <Smartphone className="h-5 w-5 text-amber-600" />
              <h4 className="text-sm font-black">فتح النظام من الهاتف ومن أي دولة (Phone & Remote Access)</h4>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              يمكنك فتح البرنامج من هاتفك المحمول وأنت خارج الشركة أو في أي بلد آخر للاطلاع على المبيعات، المنتجات، الصندوق، وكادر العمل لحظة بلحظة. كل ما عليك هو مسح رمز QR أو فتح الرابط أدناه على هاتفك:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-white p-4 rounded-2xl border border-slate-200">
              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                <img
                  src={qrCodeUrl}
                  alt="QR Code For Phone Link"
                  className="w-32 h-32 rounded-lg border border-slate-200 shadow-2xs"
                />
                <span className="text-[10px] font-bold text-slate-500 mt-2 flex items-center gap-1">
                  <QrCode className="h-3 w-3 text-amber-600" />
                  امسح بكاميرا الهاتف
                </span>
              </div>

              {/* Link Box */}
              <div className="md:col-span-2 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    رابط المزامنة المباشر للهاتف:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={mobileUrl}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-[11px] font-mono text-slate-700 select-all focus:outline-none"
                    />
                    <button
                      onClick={handleCopyLink}
                      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition shrink-0 cursor-pointer ${
                        copiedLink
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      <span>{copiedLink ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                    </button>
                  </div>
                </div>

                {/* Sync Key Info */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500">مفتاح ربط الشركة:</span>
                    <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                      {syncKey}
                    </span>
                  </div>

                  <button
                    onClick={handleCopyKey}
                    className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    {copiedKey ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedKey ? 'تم نسخ المفتاح' : 'نسخ المفتاح فقط'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Database Details & Custom Sync Key */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900">
                <Database className="h-5 w-5 text-indigo-600" />
                <h4 className="text-sm font-black">بيانات السحابة ومفتاح التشفير المشترك</h4>
              </div>

              {!isEditingKey && (
                <button
                  onClick={() => setIsEditingKey(true)}
                  className="text-xs font-bold text-amber-700 hover:underline"
                >
                  تغيير مفتاح الربط
                </button>
              )}
            </div>

            {isEditingKey ? (
              <form onSubmit={handleSaveKey} className="space-y-3 bg-amber-50/50 p-4 rounded-xl border border-amber-200">
                <p className="text-[11px] text-amber-900 font-medium">
                  يمكنك كتابة اسم أو رمز خاص بشركتك (مثال: <code className="font-mono font-bold">company_iraq_2026</code>) ليتم استخدامه كقناة مزامنة خاصة بين أجهزتك.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={customKeyInput}
                    onChange={(e) => setCustomKeyInput(e.target.value)}
                    placeholder="مفتاح المزامنة"
                    className="flex-1 rounded-xl border border-slate-300 bg-white p-2 text-xs font-bold focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-slate-950 hover:bg-amber-600"
                  >
                    حفظ المفتاح
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomKeyInput(syncKey);
                      setIsEditingKey(false);
                    }}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="block font-bold text-slate-500">معرف قاعدة بيانات Firestore:</span>
                  <span className="block font-mono font-bold text-slate-800 mt-1 truncate">
                    ai-studio-goldentemplate-2e2fde9c-4658-4754-85db-83196ae724bd
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="block font-bold text-slate-500">نوع المزامنة:</span>
                  <span className="block font-bold text-emerald-700 mt-1 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    مزامنة فورية ثنائية الاتجاه (Bidirectional Real-time)
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
          <p className="text-[11px] text-slate-500">
            🔒 كافة البيانات مشفرة ومؤمنة بقواعد حماية Firestore Security Rules.
          </p>

          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-extrabold text-white hover:bg-slate-800 cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
