import React from 'react'

interface InputProps {
  label?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  placeholder?: string
  value: string | number
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
  required?: boolean
  min?: number
  max?: number
  step?: number
}

const Input: React.FC<InputProps> = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  className = '',
  disabled = false,
  required = false,
  min,
  max,
  step
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-f1-text">
          {label}
          {required && <span className="text-f1-red ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        min={min}
        max={max}
        step={step}
        className="input-field w-full"
      />
    </div>
  )
}

export default Input
