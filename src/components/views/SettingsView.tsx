import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Settings, Shield, User, Plus, Edit2, Trash2, Save, X, Key, Check, ShieldAlert, Eye, EyeOff, Lock, Phone, Instagram, MessageCircle, Send } from 'lucide-react';
import { User as UserType, UserRole, UserPermissions } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';

export const SettingsView: React.FC = () => {
  const {
    companySettings,
    updateCompanySettings,
    users,
    addUser,
    updateUser,
    deleteUser,
    currentUser,
    t,
  } = useApp();

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.permissions?.manageUsers;
  const isSuperAdmin = currentUser?.username === 'taha' || currentUser?.id === 'usr-super-taha';

  const [activeTab, setActiveTab] = useState<'COMPANY' | 'USERS' | 'PROFILE'>('COMPANY');

  // Company Form State
  const [compNameAr, setCompNameAr] = useState(companySettings?.companyNameArabic || '');
  const [compNameEn, setCompNameEn] = useState(companySettings?.companyName || '');
  const [tagline, setTagline] = useState(companySettings?.tagline || '');
  const [address, setAddress] = useState(companySettings?.address || '');
  const [phone, setPhone] = useState(companySettings?.phone || '');
  const [taxNo, setTaxNo] = useState(companySettings?.taxNumber || '');
  
  // Developer Contact Info States (Only editable by Super Admin, but shown to all)
  const [devContactPhone, setDevContactPhone] = useState(companySettings?.devContactPhone || '');
  const [devInstagram, setDevInstagram] = useState(companySettings?.devInstagram || '');
  const [devWhatsapp, setDevWhatsapp] = useState(companySettings?.devWhatsapp || '');
  const [devTelegram, setDevTelegram] = useState(companySettings?.devTelegram || '');

  const [companySuccessMsg, setCompanySuccessMsg] = useState('');

  // Users Form Modal (Admin only)
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPasswordInModal, setShowPasswordInModal] = useState(false);
  const [role, setRole] = useState<UserRole>('CASHIER');
  const [permissions, setPermissions] = useState<UserPermissions>({
    manageProducts: true,
    manageSales: true,
    managePurchases: false,
    manageExpenses: false,
    manageEmployees: false,
    manageDebts: false,
    viewFinancialReports: false,
    viewAuditLogs: false,
    modifyRecords: false,
    deleteRecords: false,
    restoreDeleted: false,
    manageBackups: false,
    manageTemplates: false,
    manageUsers: false,
  });

  // Admin Quick Password Change Modal
  const [showAdminPassModal, setShowAdminPassModal] = useState(false);
  const [targetUserForPass, setTargetUserForPass] = useState<UserType | null>(null);
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [showAdminNewPass, setShowAdminNewPass] = useState(false);
  const [adminPassMsg, setAdminPassMsg] = useState({ type: '', text: '' });

  // User Deletion State
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);

  // My Profile Password Change Form
  const [myOldPassword, setMyOldPassword] = useState('');
  const [myNewPassword, setMyNewPassword] = useState('');
  const [myConfirmPassword, setMyConfirmPassword] = useState('');
  const [showMyOldPass, setShowMyOldPass] = useState(false);
  const [showMyNewPass, setShowMyNewPass] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings({
      companyNameArabic: compNameAr,
      companyName: compNameEn,
      tagline,
      address,
      phone,
      taxNumber: taxNo,
      currency: companySettings?.currency || 'IQD',
      defaultLanguage: companySettings?.defaultLanguage || 'ar',
      devContactPhone: isSuperAdmin ? devContactPhone : (companySettings?.devContactPhone || ''),
      devInstagram: isSuperAdmin ? devInstagram : (companySettings?.devInstagram || ''),
      devWhatsapp: isSuperAdmin ? devWhatsapp : (companySettings?.devWhatsapp || ''),
      devTelegram: isSuperAdmin ? devTelegram : (companySettings?.devTelegram || ''),
    });
    setCompanySuccessMsg('تم حفظ إعدادات وهوية الشركة بنجاح');
    setTimeout(() => setCompanySuccessMsg(''), 4000);
  };

  const handleOpenAddUser = () => {
    if (!isAdmin) return;
    setEditingUser(null);
    setUsername('');
    setFullName('');
    setPassword('');
    setRole('CASHIER');
    setPermissions({
      manageProducts: true,
      manageSales: true,
      managePurchases: false,
      manageExpenses: false,
      manageEmployees: false,
      manageDebts: false,
      viewFinancialReports: false,
      viewAuditLogs: false,
      modifyRecords: false,
      deleteRecords: false,
      restoreDeleted: false,
      manageBackups: false,
      manageTemplates: false,
      manageUsers: false,
    });
    setShowUserModal(true);
  };

  const handleOpenEditUser = (u: UserType) => {
    if (!isAdmin) return;
    setEditingUser(u);
    setUsername(u.username || '');
    setFullName(u.fullName || '');
    setPassword(u.password || '');
    setRole(u.role || 'CASHIER');
    setPermissions(u.permissions || {
      manageProducts: true,
      manageSales: true,
      managePurchases: false,
      manageExpenses: false,
      manageEmployees: false,
      manageDebts: false,
      viewFinancialReports: false,
      viewAuditLogs: false,
      modifyRecords: false,
      deleteRecords: false,
      restoreDeleted: false,
      manageBackups: false,
      manageTemplates: false,
      manageUsers: false,
    });
    setShowUserModal(true);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (!username.trim()) {
      alert('يرجى كتابة اسم المستخدم');
      return;
    }

    if (!editingUser && !password.trim()) {
      alert('يرجى تحديد كلمة مرور للمستخدم الجديد');
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, {
        username: username.trim(),
        fullName: fullName.trim(),
        password: password.trim() || editingUser.password || '123456',
        role,
        permissions,
      });
    } else {
      addUser({
        username: username.trim(),
        fullName: fullName.trim(),
        password: password.trim() || '123456',
        role,
        permissions,
        isActive: true,
      });
    }
    setShowUserModal(false);
  };

  const handleOpenAdminPassModal = (u: UserType) => {
    if (!isAdmin) return;
    setTargetUserForPass(u);
    setAdminNewPassword('');
    setAdminPassMsg({ type: '', text: '' });
    setShowAdminPassModal(true);
  };

  const handleAdminChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !targetUserForPass) return;

    if (!adminNewPassword.trim()) {
      setAdminPassMsg({ type: 'error', text: 'يرجى كتابة كلمة المرور الجديدة' });
      return;
    }

    updateUser(targetUserForPass.id, {
      password: adminNewPassword.trim(),
    });

    setAdminPassMsg({ type: 'success', text: `تم تحديث كلمة المرور للمستخدم @${targetUserForPass.username} بنجاح` });
    setTimeout(() => {
      setShowAdminPassModal(false);
    }, 1500);
  };

  const handleMyPasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });

    if (!currentUser) return;

    const currentPass = currentUser.password || '123456';
    if (myOldPassword.trim() !== currentPass) {
      setProfileMsg({ type: 'error', text: 'كلمة المرور الحالية غير صحيحة' });
      return;
    }

    if (!myNewPassword.trim()) {
      setProfileMsg({ type: 'error', text: 'يرجى إدخال كلمة المرور الجديدة' });
      return;
    }

    if (myNewPassword.trim() !== myConfirmPassword.trim()) {
      setProfileMsg({ type: 'error', text: 'كلمة المرور الجديدة وتأكيدها غير متطابقين' });
      return;
    }

    updateUser(currentUser.id, {
      password: myNewPassword.trim(),
    });

    setProfileMsg({ type: 'success', text: 'تم تغيير كلمة المرور الخاصة بك بنجاح' });
    setMyOldPassword('');
    setMyNewPassword('');
    setMyConfirmPassword('');
  };

  const permissionLabels: { key: keyof UserPermissions; label: string }[] = [
    { key: 'manageProducts', label: 'إدارة وحفظ المنتجات وتكلفة التصنيع' },
    { key: 'manageSales', label: 'إصدار فواتير المبيعات POS' },
    { key: 'managePurchases', label: 'إدارة فواتير المشتريات والتوريد' },
    { key: 'manageExpenses', label: 'تسجيل وتصنيف المصاريف' },
    { key: 'manageEmployees', label: 'إدارة كادر الموظفين والرواتب' },
    { key: 'manageDebts', label: 'متابعة وتسديد ديون الزبائن والموردين' },
    { key: 'viewFinancialReports', label: 'عرض الأرباح والقوائم المالية' },
    { key: 'viewAuditLogs', label: 'استعراض سجل الأحداث والرقابة' },
    { key: 'modifyRecords', label: 'تعديل السجلات والفواتير السابقة' },
    { key: 'deleteRecords', label: 'صلاحية حذف الفواتير مؤقتاً' },
    { key: 'restoreDeleted', label: 'استعادة المحذوفات من الأرشيف' },
    { key: 'manageBackups', label: 'تصدير واستعادة النسخ الاحتياطية' },
    { key: 'manageTemplates', label: 'تعديل قوالب طباعة الوصلات' },
    { key: 'manageUsers', label: 'إدارة المستخدمين والصلاحيات' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-xs border border-gray-100">
        <div>
          <h2 className="text-xl font-black text-gray-900">{t('settings')}</h2>
          <p className="text-xs text-gray-500">إعدادات الهوية التجارية وإدارة المستخدمين وكلمات المرور</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('COMPANY')}
              className={`rounded-lg px-4 py-2 transition ${
                activeTab === 'COMPANY' ? 'bg-amber-500 text-slate-950 font-black shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              بيانات الشركة
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveTab('USERS')}
                className={`rounded-lg px-4 py-2 transition ${
                  activeTab === 'USERS' ? 'bg-amber-500 text-slate-950 font-black shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                إدارة المستخدمين وكلمات المرور
              </button>
            )}

            <button
              onClick={() => setActiveTab('PROFILE')}
              className={`rounded-lg px-4 py-2 transition ${
                activeTab === 'PROFILE' ? 'bg-amber-500 text-slate-950 font-black shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              حسابي وتغيير كلمة سري
            </button>
          </div>
        </div>
      </div>

      {/* COMPANY TAB */}
      {activeTab === 'COMPANY' && (
        <form onSubmit={handleSaveCompany} className="space-y-4 rounded-2xl bg-white p-6 shadow-xs border border-gray-100 text-xs">
          {companySuccessMsg && (
            <div className="rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800 border border-emerald-200 text-center">
              {companySuccessMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 mb-1">اسم المنشأة بالعربية *</label>
              <input
                type="text"
                required
                disabled={!isAdmin}
                value={compNameAr}
                onChange={(e) => setCompNameAr(e.target.value)}
                className={`w-full rounded-xl border p-2.5 font-semibold focus:outline-none ${
                  isAdmin ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50 text-gray-500'
                }`}
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">اسم المنشأة بالإنجليزية</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={compNameEn}
                onChange={(e) => setCompNameEn(e.target.value)}
                className={`w-full rounded-xl border p-2.5 font-semibold focus:outline-none ${
                  isAdmin ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50 text-gray-500'
                }`}
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">شعار النشاط (السطر التعريفي)</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className={`w-full rounded-xl border p-2.5 font-semibold focus:outline-none ${
                  isAdmin ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50 text-gray-500'
                }`}
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">رقم الهاتف والتواصل</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full rounded-xl border p-2.5 font-semibold focus:outline-none ${
                  isAdmin ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50 text-gray-500'
                }`}
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">العنوان الكامل</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={`w-full rounded-xl border p-2.5 font-semibold focus:outline-none ${
                  isAdmin ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50 text-gray-500'
                }`}
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">الرقم الضريبي أو السجل التجاري</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={taxNo}
                onChange={(e) => setTaxNo(e.target.value)}
                className={`w-full rounded-xl border p-2.5 font-semibold focus:outline-none ${
                  isAdmin ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-50 text-gray-500'
                }`}
              />
            </div>
          </div>

          {/* Developer Support & Contacts - Only editable by Super Admin ('taha'), beautiful clickable buttons for others */}
          <div className="mt-6 border-t border-gray-100 pt-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-black text-emerald-800">الدعم الفني وتواصل المطور (KHDMAT TEAM)</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {isSuperAdmin 
                    ? "بصفتك المطور الرئيسي للبرنامج (Super Admin)، يمكنك تعديل قنوات التواصل أدناه التي تظهر لكافة مستخدمي النظام."
                    : "يمكنك التواصل معنا مباشرة للحصول على الدعم الفني، الاستفسارات، أو طلب ميزات جديدة بالنظام."}
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                isSuperAdmin ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
              }`}>
                {isSuperAdmin ? 'وضع التعديل نشط (Super Admin)' : 'فريق خدمات المطور'}
              </span>
            </div>

            {isSuperAdmin ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">رقم هاتف المطور (Contact Phone)</label>
                  <input
                    type="text"
                    disabled={!isSuperAdmin}
                    value={devContactPhone}
                    onChange={(e) => setDevContactPhone(e.target.value)}
                    placeholder="مثال: +964 770 000 0000"
                    className="w-full rounded-xl border p-2.5 font-semibold focus:outline-none border-gray-300 bg-white focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">رقم الواتساب (WhatsApp Number)</label>
                  <input
                    type="text"
                    disabled={!isSuperAdmin}
                    value={devWhatsapp}
                    onChange={(e) => setDevWhatsapp(e.target.value)}
                    placeholder="مثال: +9647700000000"
                    className="w-full rounded-xl border p-2.5 font-semibold focus:outline-none border-gray-300 bg-white focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">حساب تليجرام (Telegram User)</label>
                  <input
                    type="text"
                    disabled={!isSuperAdmin}
                    value={devTelegram}
                    onChange={(e) => setDevTelegram(e.target.value)}
                    placeholder="مثال: khdmat_team"
                    className="w-full rounded-xl border p-2.5 font-semibold focus:outline-none border-gray-300 bg-white focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">حساب انستقرام (Instagram User)</label>
                  <input
                    type="text"
                    disabled={!isSuperAdmin}
                    value={devInstagram}
                    onChange={(e) => setDevInstagram(e.target.value)}
                    placeholder="مثال: khdmat.team"
                    className="w-full rounded-xl border p-2.5 font-semibold focus:outline-none border-gray-300 bg-white focus:border-amber-500"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                {companySettings?.devContactPhone && (
                  <a
                    href={`tel:${companySettings.devContactPhone}`}
                    className="flex items-center gap-3.5 p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-200 transition-all duration-200 group text-right"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-black text-emerald-800/70">اتصال هاتف</span>
                      <span className="block text-xs font-bold text-slate-800 mt-0.5 dir-ltr">{companySettings.devContactPhone}</span>
                    </div>
                  </a>
                )}

                {companySettings?.devWhatsapp && (
                  <a
                    href={`https://wa.me/${companySettings.devWhatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3.5 p-4 rounded-xl border border-green-100 bg-green-50/40 hover:bg-green-50 hover:border-green-200 transition-all duration-200 group text-right"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500 text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-black text-green-800/70">واتساب مباشر</span>
                      <span className="block text-xs font-bold text-slate-800 mt-0.5">{companySettings.devWhatsapp}</span>
                    </div>
                  </a>
                )}

                {companySettings?.devTelegram && (
                  <a
                    href={`https://t.me/${companySettings.devTelegram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3.5 p-4 rounded-xl border border-sky-100 bg-sky-50/40 hover:bg-sky-50 hover:border-sky-200 transition-all duration-200 group text-right"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-500 text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
                      <Send className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-black text-sky-800/70">قناة تليجرام</span>
                      <span className="block text-xs font-bold text-slate-800 mt-0.5">@{companySettings.devTelegram.replace('@', '')}</span>
                    </div>
                  </a>
                )}

                {companySettings?.devInstagram && (
                  <a
                    href={`https://instagram.com/${companySettings.devInstagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3.5 p-4 rounded-xl border border-pink-100 bg-pink-50/40 hover:bg-pink-50 hover:border-pink-200 transition-all duration-200 group text-right"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-500 via-red-500 to-purple-600 text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
                      <Instagram className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-black text-pink-800/70">انستغرام خدمات</span>
                      <span className="block text-xs font-bold text-slate-800 mt-0.5">@{companySettings.devInstagram.replace('@', '')}</span>
                    </div>
                  </a>
                )}
              </div>
            )}
          </div>

          {(isAdmin || isSuperAdmin) && (
            <div className="flex justify-end pt-4 border-t">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-extrabold text-slate-950 shadow-md hover:bg-amber-600 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                حفظ التغييرات
              </button>
            </div>
          )}
        </form>
      )}

      {/* USERS TAB - ADMIN ONLY */}
      {activeTab === 'USERS' && isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-amber-50 p-4 rounded-2xl border border-amber-200">
            <div>
              <p className="text-xs font-black text-amber-900">لوحة تحكم مدير النظام (Admin)</p>
              <p className="text-[11px] text-amber-700">بصفتك مديراً، يمكنك إنشاء وتعديل أي مستخدم وتعيين كلمة المرور لأي حساب مباشرة.</p>
            </div>
            <button
              onClick={handleOpenAddUser}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-extrabold text-slate-950 shadow-md hover:bg-amber-600 cursor-pointer shrink-0"
            >
              <Plus className="h-4 w-4" />
              إضافة مستخدم جديد
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.filter(u => u.username !== 'taha' && u.id !== 'usr-super-taha').map((u) => (
              <div key={u.id} className="rounded-2xl bg-white p-5 shadow-xs border border-gray-200 hover:border-amber-400 transition flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-gray-900">{u.fullName}</h3>
                      <p className="text-xs text-amber-700 font-bold">@{u.username}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      u.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700' :
                      u.role === 'ACCOUNTANT' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {t(u.role as any) || u.role}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-600 bg-gray-50 p-2 rounded-lg">
                    <Key className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>كلمة المرور الحالية:</span>
                    <span className="font-mono font-bold text-gray-800 tracking-wider">
                      {u.password ? '••••••••' : '(غير معينة - افتراضي 123456)'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-gray-500 font-bold">
                    الصلاحيات: {Object.values(u.permissions || {}).filter(Boolean).length} / {Object.keys(u.permissions || {}).length}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenAdminPassModal(u)}
                      title="تغيير كلمة المرور لهذا المستخدم"
                      className="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100 transition cursor-pointer"
                    >
                      <Key className="h-3 w-3" />
                      تغيير كلمة السر
                    </button>

                    <button
                      onClick={() => handleOpenEditUser(u)}
                      title="تعديل المستخدم والصلاحيات"
                      className="rounded-lg p-1.5 text-gray-400 hover:text-amber-600 hover:bg-gray-100 cursor-pointer"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => setUserToDelete(u)}
                      title="حذف المستخدم"
                      className="rounded-lg p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MY PROFILE & CHANGE MY PASSWORD TAB */}
      {activeTab === 'PROFILE' && (
        <div className="rounded-2xl bg-white p-6 shadow-xs border border-gray-100 space-y-6 text-xs">
          <div className="flex items-center gap-3 border-b pb-4">
            <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 font-black text-xl">
              {currentUser?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">{currentUser?.fullName}</h3>
              <p className="text-xs text-amber-700 font-bold">@{currentUser?.username} ({t(currentUser?.role as any) || currentUser?.role})</p>
            </div>
          </div>

          <form onSubmit={handleMyPasswordChange} className="space-y-4 max-w-md">
            <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-600" />
              تغيير كلمة المرور الخاصة بي:
            </h4>

            {profileMsg.text && (
              <div className={`p-3 rounded-xl text-xs font-bold text-center ${
                profileMsg.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}>
                {profileMsg.text}
              </div>
            )}

            <div>
              <label className="block font-bold text-gray-700 mb-1">كلمة المرور الحالية *</label>
              <div className="relative">
                <input
                  type={showMyOldPass ? 'text' : 'password'}
                  required
                  placeholder="أدخل كلمة مرورك الحالية"
                  value={myOldPassword}
                  onChange={(e) => setMyOldPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 pl-10 font-bold focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowMyOldPass(!showMyOldPass)}
                  className="absolute left-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showMyOldPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">كلمة المرور الجديدة *</label>
              <div className="relative">
                <input
                  type={showMyNewPass ? 'text' : 'password'}
                  required
                  placeholder="أدخل كلمة المرور الجديدة"
                  value={myNewPassword}
                  onChange={(e) => setMyNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 pl-10 font-bold focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowMyNewPass(!showMyNewPass)}
                  className="absolute left-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showMyNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">تأكيد كلمة المرور الجديدة *</label>
              <input
                type="password"
                required
                placeholder="أعد كتابة كلمة المرور الجديدة"
                value={myConfirmPassword}
                onChange={(e) => setMyConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-2.5 font-bold focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-extrabold text-slate-950 shadow-md hover:bg-amber-600 cursor-pointer"
            >
              <Key className="h-4 w-4" />
              تحديث كلمة المرور
            </button>
          </form>
        </div>
      )}

      {/* Admin Quick Password Change Modal */}
      {showAdminPassModal && targetUserForPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2 text-amber-700">
                <Key className="h-5 w-5" />
                <h3 className="text-sm font-black text-gray-900">
                  تغيير كلمة المرور للمستخدم @{targetUserForPass.username}
                </h3>
              </div>
              <button onClick={() => setShowAdminPassModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAdminChangePassword} className="space-y-4 text-xs">
              <p className="text-gray-600 text-[11px]">
                بصفتك مديراً، يمكنك تعيين كلمة مرور جديدة للمستخدم <strong className="text-gray-900">{targetUserForPass.fullName}</strong> دون الحاجة لكلمة المرور القديمة.
              </p>

              {adminPassMsg.text && (
                <div className={`p-3 rounded-xl text-xs font-bold text-center ${
                  adminPassMsg.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  {adminPassMsg.text}
                </div>
              )}

              <div>
                <label className="block font-bold text-gray-700 mb-1">كلمة المرور الجديدة *</label>
                <div className="relative">
                  <input
                    type={showAdminNewPass ? 'text' : 'password'}
                    required
                    placeholder="اكتب كلمة المرور الجديدة"
                    value={adminNewPassword}
                    onChange={(e) => setAdminNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 p-2.5 pl-10 font-bold focus:outline-none bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminNewPass(!showAdminNewPass)}
                    className="absolute left-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showAdminNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAdminPassModal(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 font-bold text-gray-700"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 px-5 py-2 font-extrabold text-slate-950 hover:bg-amber-600 cursor-pointer"
                >
                  حفظ كلمة المرور
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit User Modal (Admin only) */}
      {showUserModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-gray-900">
                {editingUser ? `تعديل بيانات وصلاحيات @${editingUser.username}` : 'إنشاء حساب مستخدم جديد'}
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUserSubmit} className="overflow-y-auto space-y-4 flex-1 pr-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">اسم المستخدم *</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 p-2 font-bold focus:outline-none"
                    placeholder="مثال: ahmed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">الاسم الكامل *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 p-2 font-bold focus:outline-none"
                    placeholder="الاسم الكامل"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    {editingUser ? 'كلمة المرور (تعديل مباشر)' : 'كلمة المرور *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswordInModal ? 'text' : 'password'}
                      required={!editingUser}
                      placeholder={editingUser ? 'اتركها كما هي أو اكتب جديدة' : 'كلمة المرور'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 p-2 pl-9 font-bold focus:outline-none bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordInModal(!showPasswordInModal)}
                      className="absolute left-2.5 top-2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswordInModal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">الدور الوظيفي الرئيسي</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full rounded-xl border border-gray-300 p-2 font-bold focus:outline-none bg-white"
                  >
                    <option value="ADMIN">مدير النظام (Admin)</option>
                    <option value="ACCOUNTANT">محاسب (Accountant)</option>
                    <option value="CASHIER">كاشير (Cashier)</option>
                  </select>
                </div>
              </div>

              {/* Permissions Checklist */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2">
                <h4 className="font-extrabold text-gray-900 mb-2">تخصيص الصلاحيات بالتفصيل:</h4>
                <div className="space-y-2">
                  {permissionLabels.map((perm) => (
                    <label key={perm.key} className="flex items-center gap-2 cursor-pointer text-gray-800 font-semibold">
                      <input
                        type="checkbox"
                        checked={!!permissions[perm.key]}
                        onChange={(e) =>
                          setPermissions({
                            ...permissions,
                            [perm.key]: e.target.checked,
                          })
                        }
                        className="rounded text-amber-500"
                      />
                      {perm.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 font-bold text-gray-700"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 px-5 py-2 font-extrabold text-slate-950 hover:bg-amber-600 cursor-pointer"
                >
                  حفظ المستخدم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm User Deletion Modal */}
      <ConfirmModal
        isOpen={!!userToDelete}
        title="تأكيد حذف المستخدم"
        message={`هل أنت متأكد من رغبتك في حذف حساب المستخدم "${userToDelete?.fullName}" (@${userToDelete?.username})؟ سيتم حذفه نهائياً من النظام وقاعدة بيانات السحابة.`}
        confirmText="نعم، حذف المستخدم"
        cancelText="إلغاء"
        onConfirm={() => {
          if (userToDelete) {
            deleteUser(userToDelete.id);
            setUserToDelete(null);
          }
        }}
        onCancel={() => setUserToDelete(null)}
      />
    </div>
  );
};
