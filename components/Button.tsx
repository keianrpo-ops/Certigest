import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'menu';
  className?: string;
  active?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  active = false,
  ...props 
}) => {
  const baseStyles = "rounded-full transition-all duration-200 font-medium text-sm flex items-center justify-center gap-2 outline-none focus:ring-2 focus:ring-cyan-500/50";
  
  const variants = {
    primary: "bg-gradient-to-br from-cyan-400 to-cyan-600 text-slate-900 shadow-lg shadow-cyan-900/50 hover:-translate-y-0.5 hover:shadow-cyan-900/70 border-0 py-3 px-6",
    secondary: "bg-slate-900/90 border border-slate-700/50 text-slate-200 hover:bg-slate-800 hover:border-cyan-500/50 hover:text-cyan-400 py-2.5 px-5",
    ghost: "bg-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent hover:border-slate-700/50 py-2 px-4",
    menu: `w-full justify-start py-3 px-4 border ${active ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-cyan-400'}`
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
