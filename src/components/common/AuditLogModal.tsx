import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, ShieldAlert, Search, Filter } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
  const { auditLogs, t, lang } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');

  if (!isOpen) return null;

  const filteredLogs = auditLogs.filter((log) => {
    const term = (searchTerm || '').toLowerCase();
    const matchesSearch =
      (log.username || '').toLowerCase().includes(term) ||
      (log.action || '').toLowerCase().includes(term) ||
      (log.entity || '').toLowerCase().includes(term);
    const matchesEntity = entityFilter === 'ALL' || log.entity === entityFilter;
    return matchesSearch && matchesEntity;
  });

  const entities = Array.from(new Set(auditLogs.map((l) => l.entity)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-4xl rounded-xl bg-white p-6 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{t('auditLogs')}</h3>
              <p className="text-xs text-gray-500">سجل الأحداث والعمليات الأمنية والمالية بالفترة الزمنية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('search')}
              className="w-full rounded-lg border border-gray-200 py-2 pr-9 pl-3 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="rounded-lg border border-gray-200 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="ALL">{t('all')} الكيانات</option>
              {Array.from(new Set(entities || [])).map((e, idx) => (
                <option key={`audit-ent-${e}-${idx}`} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-y-auto flex-1 rounded-lg border border-gray-100">
          <table className="w-full text-right text-sm">
            <thead className="sticky top-0 bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">المستخدم</th>
                <th className="px-4 py-3">النوع / الكيان</th>
                <th className="px-4 py-3">الحدث والإجراء</th>
                <th className="px-4 py-3">القيمة السابقة</th>
                <th className="px-4 py-3">القيمة الجديدة</th>
                <th className="px-4 py-3">التاريخ والوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    لا توجد سجلات تطابق البحث
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr key={`audit-log-${log.id}-${idx}`} className="hover:bg-gray-50/70 transition">
                    <td className="px-4 py-3 font-semibold text-gray-800">@{log.username}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                        {log.entity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{log.action}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 max-w-[150px] truncate">
                      {log.previousValue || '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-emerald-600 font-semibold max-w-[150px] truncate">
                      {log.newValue || '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 dir-ltr text-right">{log.timestamp}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
