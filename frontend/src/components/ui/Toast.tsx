import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import './Toast.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 400); // Match CSS animation duration
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="toast-icon" />;
      case 'error': return <XCircle className="toast-icon" />;
      case 'warning': return <AlertCircle className="toast-icon" />;
      default: return <Info className="toast-icon" />;
    }
  };

  return (
    <div className={`toast-item ${type} ${isExiting ? 'exit' : 'enter'}`}>
      <div className="toast-content">
        <div className="toast-icon-wrapper">
          {getIcon()}
        </div>
        <div className="toast-message-wrapper">
          <p className="toast-message">{message}</p>
        </div>
        <button className="toast-close-btn" onClick={handleClose}>
          <X size={16} />
        </button>
      </div>
      <div className="toast-progress-bar">
        <div 
          className="toast-progress-fill" 
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  );
};

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

export const ToastContainer: React.FC<{ toasts: ToastMessage[], removeToast: (id: number) => void }> = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default Toast;
