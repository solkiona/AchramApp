// src/components/app/ui/TripUpdateNotification.tsx
import { useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

interface TripUpdateNotificationProps {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  onDismiss: () => void;
}

export default function TripUpdateNotification({
  message,
  type,
  onDismiss,
}: TripUpdateNotificationProps) {
  let icon = null;
  let bgColor = '';
  let textColor = '';
  let iconColor = '';

  switch (type) {
    case 'info':
      icon = <Info className="w-5 h-5" />;
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      iconColor = 'text-blue-500';
      break;
    case 'success':
      icon = <CheckCircle className="w-5 h-5" />;
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      iconColor = 'text-green-500';
      break;
    case 'warning':
      icon = <AlertTriangle className="w-5 h-5" />;
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      iconColor = 'text-yellow-500';
      break;
    case 'error':
      icon = <AlertTriangle className="w-5 h-5" />;
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      iconColor = 'text-red-500';
      break;
  }

  useEffect(()=>{
    const timer = setTimeout(()=>{
      onDismiss();
    }, 6000);

    return() => {
      clearTimeout(timer);
    }

  }, [onDismiss]);

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 max-w-xs w-full p-4 rounded-lg shadow-lg ${bgColor} ${textColor} flex items-start gap-2 z-60 animate-fadeInUp`}>
      <div className={`flex-shrink-0 mt-0.5 ${iconColor}`}>{icon}</div>
      <div className="flex-1">
        <p className="text-sm">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 text-current hover:opacity-80"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}