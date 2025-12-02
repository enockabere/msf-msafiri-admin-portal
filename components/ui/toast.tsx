"use client";

import { useState, useEffect } from "react";
import { CheckCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
      <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg border ${
        type === 'success'
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-red-50 border-red-200 text-red-800'
      }`}>
        {type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function ToastContainer() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const handleShowToast = (event: CustomEvent) => {
      setToast({
        message: event.detail.message,
        type: event.detail.type
      });
    };

    window.addEventListener('showToast', handleShowToast as EventListener);
    return () => window.removeEventListener('showToast', handleShowToast as EventListener);
  }, []);

  if (!toast) return null;

  return (
    <Toast
      message={toast.message}
      type={toast.type}
      onClose={() => setToast(null)}
    />
  );
}

// Toast function for components to use
export function toast({ title, description, variant }: { title: string; description: string; variant?: 'default' | 'destructive' }) {
  const event = new CustomEvent('showToast', {
    detail: {
      message: `${title}: ${description}`,
      type: variant === 'destructive' ? 'error' : 'success'
    }
  });
  window.dispatchEvent(event);
}