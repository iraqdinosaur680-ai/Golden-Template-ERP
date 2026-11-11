import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Plus,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  X,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  Edit2,
  Trash2,
  Search,
} from 'lucide-react';
import { Employee, AttendanceRecord, PayrollRecord } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { NumberInput } from '../common/NumberInput';
import { ConfirmModal } from '../common/ConfirmModal';

export const EmployeesView: React.FC = () => {
  const {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    recordAttendance,
    generatePayroll,
    paySalary,
    attendanceRecords,
    payrollRecords,
    currentUser,
    openPrintModal,
    t,
    lang,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'EMPLOYEES' | 'ATTENDANCE' | 'PAYROLL'>('EMPLOYEES');
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Employee State
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editBaseSalary, setEditBaseSalary] = useState<number | ''>('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Delete Employee State
  const [empToDelete, setEmpToDelete] = useState<Employee | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Reset page when tab, month, date, or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedMonth, selectedDate, searchQuery]);

  // Employee Form State
  const [empName, setEmpName] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empRole, setEmpRole] = useState('عامل خط إنتاج');
  const [baseSalary, setBaseSalary] = useState<number | ''>('');

  // Payroll Adjustments Modal
  const [payrollModalEmp, setPayrollModalEmp] = useState<Employee | null>(null);
  const [bonus, setBonus] = useState<number>(0);
  const [deductions, setDeductions] = useState<number>(0);
  const [payrollNotes, setPayrollNotes] = useState('');

  const handleAddEmpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName || !baseSalary) return;

    addEmployee({
      fullName: empName,
      phone: empPhone,
      role: empRole,
      hireDate: new Date().toISOString().split('T')[0],
      baseSalary: Number(baseSalary),
      status: 'ACTIVE',
    });

    setShowAddEmpModal(false);
    setEmpName('');
    setEmpPhone('');
    setBaseSalary('');
  };

  const handleStartEdit = (emp: Employee) => {
    setEditingEmp(emp);
    setEditName(emp.fullName);
    setEditPhone(emp.phone || '');
    setEditRole(emp.role);
    setEditBaseSalary(emp.baseSalary);
    setEditStatus(emp.status);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp || !editName || !editBaseSalary) return;

    updateEmployee(editingEmp.id, {
      fullName: editName,
      phone: editPhone,
      role: editRole,
      baseSalary: Number(editBaseSalary),
      status: editStatus,
    });

    setEditingEmp(null);
  };

  const handleGeneratePayrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payrollModalEmp) return;

    generatePayroll(payrollModalEmp.id, selectedMonth, bonus, deductions, payrollNotes);
    setPayrollModalEmp(null);
    setBonus(0);
    setDeductions(0);
    setPayrollNotes('');
  };

  // Filter and Paginate
  const filteredEmployees = employees.filter((emp) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      emp.fullName.toLowerCase().includes(query) ||
      (emp.phone && emp.phone.includes(query)) ||
      (emp.role && emp.role.toLowerCase().includes(query))
    );
  });

  const totalRows = filteredEmployees.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-xs border border-gray-100">
        <div>
          <h2 className="text-xl font-black text-gray-900">{t('employees')}</h2>
          <p className="text-xs text-gray-500">متابعة شؤون الموظفين، سجل الحضور والغياب اليومي وحساب الرواتب والخصومات</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('EMPLOYEES')}
            className={`rounded-lg px-4 py-2 transition ${
              activeTab === 'EMPLOYEES' ? 'bg-amber-500 text-slate-950 font-black shadow-xs' : 'text-gray-600'
            }`}
          >
            كادر الموظفين ({employees.length})
          </button>
          <button
            onClick={() => setActiveTab('ATTENDANCE')}
            className={`rounded-lg px-4 py-2 transition ${
              activeTab === 'ATTENDANCE' ? 'bg-amber-500 text-slate-950 font-black shadow-xs' : 'text-gray-600'
            }`}
          >
            سجل الحضور اليومي
          </button>
          <button
            onClick={() => setActiveTab('PAYROLL')}
            className={`rounded-lg px-4 py-2 transition ${
              activeTab === 'PAYROLL' ? 'bg-amber-500 text-slate-950 font-black shadow-xs' : 'text-gray-600'
            }`}
          >
            مسير الرواتب والمكافآت
          </button>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
          <Search className="h-4 w-4" />
        </span>
        <input
          type="text"
          placeholder="ابحث باسم الموظف، المسمى الوظيفي، أو الهاتف..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white pr-9 pl-4 py-2.5 text-xs font-bold text-gray-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none placeholder-gray-400 shadow-xs transition animate-fade-in"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Tab Content: EMPLOYEES LIST */}
      {activeTab === 'EMPLOYEES' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            {currentUser?.permissions.manageEmployees && (
              <button
                onClick={() => setShowAddEmpModal(true)}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-md hover:bg-amber-600 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                إضافة موظف جديد
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedEmployees.map((emp) => (
              <div key={emp.id} className="rounded-2xl bg-white p-5 shadow-xs border border-gray-200 hover:border-amber-400 transition flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-gray-900">{emp.fullName}</h3>
                      <p className="text-xs text-amber-700 font-bold mt-0.5">{emp.role}</p>
                      <p className="text-[11px] text-gray-500">{emp.phone || '-'}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      emp.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {emp.status === 'ACTIVE' ? 'نشط على الكادر' : 'إجازة / متوقف'}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                    <span className="text-gray-500">الراتب الشهري الأساسي:</span>
                    <span className="font-extrabold text-gray-900">{formatCurrency(emp.baseSalary, lang)}</span>
                  </div>
                </div>

                {currentUser?.permissions.manageEmployees && (
                  <div className="mt-4 pt-3 border-t border-dashed border-gray-150 flex justify-end gap-2">
                    <button
                      onClick={() => handleStartEdit(emp)}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-600 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50/50 transition cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span>تعديل</span>
                    </button>
                    <button
                      onClick={() => setEmpToDelete(emp)}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50/50 transition cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
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
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>موظفين من أصل {totalRows} موظفاً</span>
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
      )}

      {/* Tab Content: DAILY ATTENDANCE */}
      {activeTab === 'ATTENDANCE' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100">
            <span className="text-xs font-bold text-gray-700">اختر تاريخ الحضور:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-gray-300 p-2 text-xs font-bold"
            />
          </div>

          <div className="rounded-2xl bg-white shadow-xs border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 font-extrabold text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="p-3">اسم الموظف</th>
                  <th className="p-3">الوظيفة</th>
                  <th className="p-3">حالة الحضور اليوم</th>
                  <th className="p-3">تسجيل الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(paginatedEmployees || []).map((emp) => {
                  const currentRec = (attendanceRecords || []).find(
                    (r) => r.employeeId === emp.id && r.date === selectedDate
                  );

                  return (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="p-3 font-bold text-gray-900">{emp.fullName}</td>
                      <td className="p-3 text-gray-600">{emp.role}</td>
                      <td className="p-3">
                        <span
                          className={`rounded px-2 py-1 text-[10px] font-bold ${
                            currentRec?.status === 'PRESENT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : currentRec?.status === 'ABSENT'
                              ? 'bg-rose-100 text-rose-800'
                              : currentRec?.status === 'LATE'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {currentRec?.status === 'PRESENT' && 'حاضر'}
                          {currentRec?.status === 'ABSENT' && 'غائب'}
                          {currentRec?.status === 'LATE' && 'متأخر'}
                          {currentRec?.status === 'LEAVE' && 'إجازة'}
                          {!currentRec && 'لم يسجل بعد'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => recordAttendance(emp.id, selectedDate, 'PRESENT')}
                            className="rounded bg-emerald-50 px-2 py-1 font-bold text-emerald-700 hover:bg-emerald-100"
                          >
                            حاضر
                          </button>
                          <button
                            onClick={() => recordAttendance(emp.id, selectedDate, 'ABSENT')}
                            className="rounded bg-rose-50 px-2 py-1 font-bold text-rose-700 hover:bg-rose-100"
                          >
                            غائب
                          </button>
                          <button
                            onClick={() => recordAttendance(emp.id, selectedDate, 'LATE')}
                            className="rounded bg-amber-50 px-2 py-1 font-bold text-amber-800 hover:bg-amber-100"
                          >
                            متأخر
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Attendance Pagination Footer */}
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
                  <span>موظفين من أصل {totalRows} موظفاً</span>
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
          </div>
        </div>
      )}

      {/* Tab Content: PAYROLL */}
      {activeTab === 'PAYROLL' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100">
            <span className="text-xs font-bold text-gray-700">شهر احتساب الرواتب:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border border-gray-300 p-2 text-xs font-bold"
            />
          </div>

          <div className="rounded-2xl bg-white shadow-xs border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 font-extrabold text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="p-3">اسم الموظف</th>
                  <th className="p-3">الراتب الأساسي</th>
                  <th className="p-3">أيام الغياب</th>
                  <th className="p-3">المكافآت</th>
                  <th className="p-3">الاستقطاعات</th>
                  <th className="p-3">صافي الراتب المستحق</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(paginatedEmployees || []).map((emp) => {
                  const rec = (payrollRecords || []).find(
                    (r) => r.employeeId === emp.id && r.month === selectedMonth
                  );

                  // Calculate absence count in month
                  const monthAbsences = (attendanceRecords || []).filter(
                    (a) => a.employeeId === emp.id && a.date.startsWith(selectedMonth) && a.status === 'ABSENT'
                  ).length;

                  return (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="p-3 font-bold text-gray-900">{emp.fullName}</td>
                      <td className="p-3">{formatCurrency(emp.baseSalary, lang)}</td>
                      <td className="p-3 font-bold text-rose-600">{monthAbsences} أيام</td>
                      <td className="p-3 text-emerald-600 font-bold">
                        {rec ? formatCurrency(rec.bonus, lang) : '-'}
                      </td>
                      <td className="p-3 text-rose-600 font-bold">
                        {rec ? formatCurrency(rec.deductions, lang) : '-'}
                      </td>
                      <td className="p-3 font-black text-gray-900">
                        {rec ? formatCurrency(rec.finalSalary, lang) : formatCurrency(emp.baseSalary, lang)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            rec?.isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rec?.isPaid ? 'تم تسليم الراتب' : 'قيد الانتظار'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setPayrollModalEmp(emp)}
                            className="rounded bg-amber-100 px-2 py-1 font-bold text-amber-800 hover:bg-amber-200"
                          >
                            احتساب وتعديل
                          </button>

                          {rec && !rec.isPaid && (
                            <button
                              onClick={() => paySalary(rec.id)}
                              className="rounded bg-emerald-600 px-2 py-1 font-bold text-white hover:bg-emerald-700"
                            >
                              تسليم الراتب
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Payroll Pagination Footer */}
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
                  <span>موظفين من أصل {totalRows} موظفاً</span>
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
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-gray-900">إضافة موظف جديد الكادر</h3>
              <button onClick={() => setShowAddEmpModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmpSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  value={empPhone}
                  onChange={(e) => setEmpPhone(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">المسمى الوظيفي</label>
                <input
                  type="text"
                  value={empRole}
                  onChange={(e) => setEmpRole(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">الراتب الشهري الأساسي (د.ع) *</label>
                <NumberInput
                  required
                  placeholder="0"
                  value={baseSalary}
                  onChange={(val) => setBaseSalary(val === '' ? '' : parseFloat(val))}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-sm font-bold text-emerald-700 focus:outline-none bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="rounded-xl border border-gray-300 px-4 py-2 font-bold text-gray-700"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 px-5 py-2 font-extrabold text-slate-950 hover:bg-amber-600"
                >
                  حفظ الموظف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Payroll Modal */}
      {payrollModalEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-gray-900">
                احتساب راتب شهر {selectedMonth} - {payrollModalEmp.fullName}
              </h3>
              <button onClick={() => setPayrollModalEmp(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleGeneratePayrollSubmit} className="space-y-4 text-xs">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                <p className="text-gray-500">الراتب الأساسي: {formatCurrency(payrollModalEmp.baseSalary, lang)}</p>
                <p className="text-gray-900 font-black text-base mt-1">
                  الصافي النهائي: {formatCurrency(payrollModalEmp.baseSalary + bonus - deductions, lang)}
                </p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">إضافة مكافأة أو حافز (د.ع)</label>
                <NumberInput
                  placeholder="0"
                  value={bonus || ''}
                  onChange={(val) => setBonus(val === '' ? 0 : parseFloat(val))}
                  className="w-full rounded-xl border border-gray-300 p-2 text-xs font-bold text-emerald-700 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">استقطاع أو خصم غياب (د.ع)</label>
                <NumberInput
                  placeholder="0"
                  value={deductions || ''}
                  onChange={(val) => setDeductions(val === '' ? 0 : parseFloat(val))}
                  className="w-full rounded-xl border border-gray-300 p-2 text-xs font-bold text-rose-600 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">ملاحظات المسير</label>
                <input
                  type="text"
                  value={payrollNotes}
                  onChange={(e) => setPayrollNotes(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setPayrollModalEmp(null)}
                  className="rounded-xl border border-gray-300 px-4 py-2 font-bold text-gray-700"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 px-5 py-2 font-extrabold text-slate-950 hover:bg-amber-600"
                >
                  تأكيد المسير
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Employee Modal */}
      {editingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-gray-900">تعديل بيانات الموظف</h3>
              <button onClick={() => setEditingEmp(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">المسمى الوظيفي</label>
                <input
                  type="text"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">الراتب الشهري الأساسي (د.ع) *</label>
                <NumberInput
                  required
                  placeholder="0"
                  value={editBaseSalary}
                  onChange={(val) => setEditBaseSalary(val === '' ? '' : parseFloat(val))}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-sm font-bold text-emerald-700 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">حالة الموظف</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                  className="w-full rounded-xl border border-gray-300 p-2.5 font-bold focus:outline-none bg-white"
                >
                  <option value="ACTIVE">نشط على الكادر</option>
                  <option value="INACTIVE">إجازة / متوقف</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditingEmp(null)}
                  className="rounded-xl border border-gray-300 px-4 py-2 font-bold text-gray-700 hover:bg-gray-50 transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 px-5 py-2 font-extrabold text-slate-950 hover:bg-amber-600 transition"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Employee Confirmation Modal */}
      <ConfirmModal
        isOpen={!!empToDelete}
        title="تأكيد حذف الموظف"
        message={`هل أنت متأكد من رغبتك في حذف الموظف "${empToDelete?.fullName}"؟ سيتم حذفه نهائياً من كادر الموظفين وقاعدة البيانات السحابية الحية.`}
        confirmText="نعم، حذف الموظف"
        cancelText="إلغاء"
        onConfirm={() => {
          if (empToDelete) {
            deleteEmployee(empToDelete.id);
            setEmpToDelete(null);
          }
        }}
        onCancel={() => setEmpToDelete(null)}
      />
    </div>
  );
};
