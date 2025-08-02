import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorPageProps {
  message: string;
  onRetry: () => void;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <AlertTriangle className="h-12 w-12 text-red-600 mb-4" />
      <h2 className="text-xl font-semibold mb-2">An error occurred</h2>
      <pre className="max-w-full whitespace-pre-wrap bg-red-50 border border-red-200 p-4 rounded mb-4 text-sm text-red-800">
        {message}
      </pre>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Back to start
      </button>
    </div>
  );
};

