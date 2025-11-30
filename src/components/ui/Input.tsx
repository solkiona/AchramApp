// src/components/ui/Input.tsx
import { InputHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  className,
  ...props
}) => {
  const containerClasses = twMerge(
    'w-full',
    className
  );

  const inputClasses = twMerge(
    'w-full pl-10 pr-4 py-3 bg-achrams-background-card rounded-xl border border-achrams-border focus:outline-none focus:ring-2 focus:ring-achrams-primary-solid',
    error ? 'border-red-500 focus:ring-red-500' : '',
    icon ? 'pl-10' : 'pl-4'
  );

  return (
    <div className={containerClasses}>
      {label && <label className="block text-sm font-medium text-achrams-text-primary mb-1">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-achrams-text-secondary">{icon}</div>}
        <input
          className={inputClasses}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Input;