"use client";

import { CheckCircle, AlertCircle, X } from "lucide-react";

interface FeedbackMessageProps {
  message: { type: 'success' | 'error', message: string };
  onClose: () => void;
}

export function FeedbackMessage({ message, onClose }: FeedbackMessageProps) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border-2 shadow-md animate-in slide-in-from-top-2 ${
      message.type === 'success'
        ? 'bg-green-50 border-green-200'
        : 'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-center gap-3">
        {message.type === 'success' ? (
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
        ) : (
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
        )}
        <span className={`text-sm font-medium ${
          message.type === 'success' ? 'text-green-800' : 'text-red-800'
        }`}>
          {message.message}
        </span>
      </div>
      <button
        onClick={onClose}
        className={`p-1 rounded-lg transition-colors ${
          message.type === 'success'
            ? 'hover:bg-green-100 text-green-600'
            : 'hover:bg-red-100 text-red-600'
        }`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}