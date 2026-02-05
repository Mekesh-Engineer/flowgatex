import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon } from 'lucide-react';

interface DatePickerProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || `date-${Math.random().toString(36).slice(2)}`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-dark-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type="datetime-local"
            className={cn(
              'w-full bg-dark-800/50 border rounded-xl px-4 py-3 pr-10',
              'text-white focus:outline-none focus:ring-1 transition-all duration-200',
              'appearance-none [color-scheme:dark]',
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50'
                : 'border-dark-700 focus:border-primary-400 focus:ring-primary-400/50',
              className
            )}
            {...props}
          />
          <CalendarIcon
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none"
          />
        </div>
        {error && <p className="mt-1.5 text-sm text-red-400">{error}</p>}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
export default DatePicker;
