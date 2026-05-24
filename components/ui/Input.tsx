import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-zinc-300">{label}</label>
      )}
      <input
        ref={ref}
        className={`bg-zinc-800 border ${
          error ? 'border-red-500 focus:border-red-500' : 'border-zinc-700 focus:border-violet-500'
        } rounded-xl px-3 py-2.5 text-zinc-100 text-sm w-full
          focus:outline-none focus:ring-2 ${error ? 'focus:ring-red-500/20' : 'focus:ring-violet-500/20'}
          transition-all duration-150 ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
);

Input.displayName = 'Input';
export default Input;
