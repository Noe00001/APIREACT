import React from 'react';

const Button = ({ children, type = 'button', variant = 'primary', onClick, className = '' }) => {
  const base = 'primary-btn';
  const variants = {
    primary: 'primary-btn',
    secondary: 'secondary-btn',
    danger: 'primary-btn',
    success: 'secondary-btn',
  };
  const cls = `${base} ${variants[variant] ?? variants.primary} ${className}`.trim();

  return (
    <button type={type} onClick={onClick} className={cls}>
      {children}
    </button>
  );
};

export default Button;
