// src/components/ui/Button.tsx
import { ButtonHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseClasses = 'font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  const sizeClasses = {
    sm: 'text-xs py-2 px-4',
    md: 'text-sm py-3 px-6',
    lg: 'text-base py-4 px-8',
  };
  const variantClasses = {
    primary: 'bg-achrams-gradient-primary text-achrams-text-light hover:opacity-90 focus:ring-achrams-primary-solid',
    secondary: 'bg-achrams-secondary-solid text-achrams-text-light hover:bg-opacity-90 focus:ring-achrams-secondary-solid',
    outline: 'border border-achrams-border text-achrams-text-primary bg-transparent hover:bg-achrams-background-secondary focus:ring-achrams-border',
    ghost: 'text-achrams-text-primary hover:bg-achrams-background-secondary focus:ring-achrams-border',
  };

  const disabledClasses = disabled || isLoading ? 'opacity-60 cursor-not-allowed' : '';

  const classes = twMerge(
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    disabledClasses,
    className
  );

  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;