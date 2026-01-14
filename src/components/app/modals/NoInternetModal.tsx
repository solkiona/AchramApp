// src/components/app/modals/NoInternetModal.tsx
import { WifiOff, RefreshCw } from 'lucide-react';

export default function NoInternetModal({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center shadow-2xl">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <WifiOff className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">No Internet Connection</h3>
        <p className="text-gray-600 text-sm mb-4">
          Please check your network and try again.
        </p>
        <button
          onClick={onRetry}
          className="w-full py-2.5 bg-achrams-primary-solid text-white rounded-lg flex items-center justify-center gap-2 hover:bg-opacity-90 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    </div>
  );
}