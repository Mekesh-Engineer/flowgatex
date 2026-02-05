import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2)}`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-dark-300 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full bg-dark-800/50 border rounded-xl px-4 py-3',
            'text-white placeholder-dark-500',
            'focus:outline-none focus:ring-1 transition-all duration-200',
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50'
              : 'border-dark-700 focus:border-primary-400 focus:ring-primary-400/50',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-sm text-dark-500">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
