import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmStyle?: 'danger' | 'primary' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  confirmStyle = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const getConfirmButtonStyle = () => {
    switch (confirmStyle) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 shadow-red-200';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 shadow-green-200';
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 shadow-blue-200';
      default:
        return 'bg-red-600 hover:bg-red-700 shadow-red-200';
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5">
          <div className="flex items-center gap-4 mb-4">
            {confirmStyle === 'danger' && (
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
              <p className="text-slate-500 text-sm mt-1">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 text-white rounded-xl font-semibold text-sm transition shadow-md ${getConfirmButtonStyle()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

