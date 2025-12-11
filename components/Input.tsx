import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="w-full">
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
        {label}
      </label>
      <input
        className={`
          w-full bg-slate-900/80 border border-slate-800 rounded-full px-4 py-3
          text-slate-200 text-sm outline-none transition-all duration-200
          placeholder-slate-600 focus:border-cyan-500 focus:bg-slate-900
          focus:ring-1 focus:ring-cyan-500/50
          ${className}
        `}
        {...props}
      />
    </div>
  );
};

export default Input;
