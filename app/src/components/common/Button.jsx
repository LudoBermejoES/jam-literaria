import React from 'react';
import './Button.css';

const Button = ({ 
  children, 
  type = 'button', 
  onClick, 
  disabled = false, 
  className = '',
  variant = 'primary',
  size = 'medium'
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} btn-${size} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button; 