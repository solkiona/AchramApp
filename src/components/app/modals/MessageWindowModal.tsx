// src/components/app/modals/MessageWindowModal.tsx
import { X, Send } from 'lucide-react';
import { useState } from 'react';

interface MessageWindowModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
}

export default function MessageWindowModal({
  isOpen,
  onClose,
  recipientName,
}: MessageWindowModalProps) {
  const [message, setMessage] = useState('');

  const sendMessage = () => {
    if (message.trim()) {
      // In real app: call /messages or WebSocket
      console.log('Message sent to', recipientName, ':', message);
      setMessage('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-achrams-secondary-solid/50 z-50 animate-fadeIn">
      <div className="h-full flex flex-col">
        <div className="bg-achrams-primary-solid text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Message {recipientName}</h2>
          <button onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 p-4 bg-gray-100 overflow-y-auto">
          {/* Example message history */}
          <div className="bg-white rounded-2xl p-4 mb-4 max-w-xs ml-auto">
            <p className="text-sm">Hi, I’m outside!</p>
          </div>
          <div className="bg-gray-200 rounded-2xl p-4 mb-4 max-w-xs">
            <p className="text-sm">OK, coming down now.</p>
          </div>
        </div>

        <div className="p-4 border-t bg-white">
          <div className="flex gap-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 bg-gray-100 rounded-full outline-none"
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim()}
              className="p-3 bg-achrams-primary-solid text-white rounded-full disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}