import React from 'react'

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'gold'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  style?: React.CSSProperties
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  onClick,
  disabled = false,
  type = 'button',
  style
}) => {
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
  
  const variantClasses = {
    primary: 'bg-f1-red hover:bg-red-700 text-white',
    secondary: 'bg-f1-gray hover:bg-f1-light-gray text-f1-text border border-f1-light-gray',
    outline: 'border border-f1-red text-f1-red hover:bg-f1-red hover:text-white',
    gold: 'bg-gradient-to-r from-f1-gold to-f1-gold-dark text-f1-darker hover:from-f1-gold-light hover:to-f1-gold shadow-lg'
  }
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  )
}

export default Button
