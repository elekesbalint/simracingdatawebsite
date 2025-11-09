import React from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label?: string
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
}

const Select: React.FC<SelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Válassz...',
  className = '',
  disabled = false,
  required = false
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-f1-text">
          {label}
          {required && <span className="text-f1-red ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
          className="input-field w-full appearance-none pr-10 cursor-pointer"
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-f1-text-secondary pointer-events-none" />
      </div>
    </div>
  )
}

export default Select
