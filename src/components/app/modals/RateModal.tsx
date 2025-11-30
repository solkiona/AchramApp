// src/components/app/modals/RateModal.tsx
import { X, Star, Check } from 'lucide-react';
import { useState } from 'react';

interface RateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRate: (score: number, comment: string) => void;
  driverName?: string;
  // NEW: Prop to update the parent's notification state
  setNotification: (notification: { message: string; type: 'info' | 'success' | 'warning' | 'error' } | null) => void;
}

export default function RateModal({
  isOpen,
  onClose,
  onRate,
  driverName = 'your driver',
  setNotification, // NEW: Destructure the new prop
}: RateModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (rating > 0) {
      // NEW: Call the API/rate handling function passed from parent (e.g., page.tsx)
      onRate(rating, comment);

      // NEW: Close the modal
      onClose();

      // NEW: Set the success notification in the parent component via the prop
      setNotification({
        message: 'Thank you for your feedback!',
        type: 'success'
      });

      // NEW: Optionally, reset local state after submission
      // setRating(0); // Resetting rating might be confusing if the API call fails, so leaving it as is for now
      // setComment('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bg-achrams-secondary-solid/50 inset-0 bg-opacity-50 flex items-end z-50 animate-fadeIn ">
      <div className="bg-white w-full rounded-t-3xl p-6 animate-slideUp max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">Rate {driverName}</h3>
          <button onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className="transform hover:scale-110 transition"
            >
              <Star
                className={`w-12 h-12 ${
                  star <= rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>

        <textarea
          placeholder="Share your experience (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full px-4 py-3 bg-achrams-bg-secondary rounded-xl outline-none text-achrams-text-primary resize-none mb-6 border border-achrams-border"
          rows={3}
        />

        <button
          onClick={handleSubmit}
          disabled={rating === 0}
          className="w-full bg-achrams-primary-solid text-achrams-text-light py-4 rounded-xl font-semibold disabled:bg-gray-300"
        >
          Submit
        </button>
      </div>
    </div>
  );
}