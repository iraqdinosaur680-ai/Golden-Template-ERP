import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  requireReason?: boolean;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  requireReason = false,
  onConfirm,
  onCancel,
}) => {
  const { t } = useApp();
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-start space-x-3 space-x-reverse mb-4">
          <div className="rounded-full bg-rose-100 p-2.5 text-rose-600 shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-600">{message}</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {requireReason && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {t('reasonPrompt')}
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="اكتب سبب الإجراء..."
              className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-rose-500 focus:outline-none"
            />
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-3 space-x-reverse">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            {cancelText || t('cancel')}
          </button>
          <button
            onClick={() => {
              onConfirm(reason);
              setReason('');
            }}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 transition shadow-sm"
          >
            {confirmText || t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};
