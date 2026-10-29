import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="p-4 bg-rose-500/10 text-rose-400 rounded-full border border-rose-500/20 mb-4">
        <AlertCircle className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-bold text-slate-100 mb-2">404 - Page Not Found</h2>
      <p className="text-sm text-slate-400 max-w-md mb-6">
        The requested route does not exist in the CRC Integrity System module registry.
      </p>
      <Link
        to="/"
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Dashboard
      </Link>
    </div>
  );
};
