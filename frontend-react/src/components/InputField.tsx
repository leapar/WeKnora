import { useState, forwardRef, useImperativeHandle } from 'react'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, X } from 'lucide-react'

interface InputFieldProps {
  label?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  prefixIcon?: React.ReactNode
  suffixIcon?: React.ReactNode
  suffixText?: string
  clearable?: boolean
  maxlength?: number
  showWordLimit?: boolean
  type?: string
  status?: 'error' | 'success' | 'warning' | 'default'
  value?: string
  onChange?: (value: string) => void
  onClear?: () => void
  autofocus?: boolean
  className?: string
}

export interface InputFieldRef {
  focus: () => void
  blur: () => void
}

export const InputField = forwardRef<InputFieldRef, InputFieldProps>(
  (
    {
      label,
      placeholder,
      disabled = false,
      readonly = false,
      prefixIcon,
      suffixIcon,
      suffixText,
      clearable = false,
      maxlength,
      showWordLimit = false,
      type = 'text',
      status = 'default',
      value = '',
      onChange,
      onClear,
      autofocus = false,
      className = '',
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    const [internalValue, setInternalValue] = useState(value)

    const currentValue = value !== undefined ? value : internalValue

    useImperativeHandle(ref, () => ({
      focus: () => {
        const input = document.getElementById(label || 'input-field')
        input?.focus()
      },
      blur: () => {
        const input = document.getElementById(label || 'input-field')
        input?.blur()
      },
    }))

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      if (maxlength && newValue.length > maxlength) return
      setInternalValue(newValue)
      onChange?.(newValue)
    }

    const handleClear = () => {
      setInternalValue('')
      onClear?.()
      onChange?.('')
    }

    const isPassword = type === 'password'
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type

    const statusClasses = {
      error: 'border-[var(--td-error-color)] focus:border-[var(--td-error-color)]',
      success: 'border-[var(--td-success-color)] focus:border-[var(--td-success-color)]',
      warning: 'border-[var(--td-warning-color)] focus:border-[var(--td-warning-color)]',
      default: '',
    }

    return (
      <div className={`flex flex-col ${className}`}>
        {label && (
          <label className="text-sm font-medium mb-1.5 text-[var(--td-text-color-primary)]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefixIcon && (
            <span className="absolute left-3 text-[var(--td-text-color-placeholder)]">
              {prefixIcon}
            </span>
          )}
          <Input
            id={label || 'input-field'}
            type={inputType}
            value={currentValue}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readonly}
            autoFocus={autofocus}
            className={`
              ${prefixIcon ? 'pl-10' : ''}
              ${(suffixIcon || suffixText || clearable || isPassword) ? 'pr-10' : ''}
              ${status !== 'default' ? statusClasses[status] : ''}
            `}
          />
          {clearable && currentValue && !disabled && !readonly && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 text-[var(--td-text-color-placeholder)] hover:text-[var(--td-text-color-secondary)]"
            >
              <X size={16} />
            </button>
          )}
          {isPassword && !showPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(true)}
              className="absolute right-3 text-[var(--td-text-color-placeholder)] hover:text-[var(--td-text-color-secondary)]"
            >
              <EyeOff size={16} />
            </button>
          )}
          {isPassword && showPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(false)}
              className="absolute right-3 text-[var(--td-text-color-placeholder)] hover:text-[var(--td-text-color-secondary)]"
            >
              <Eye size={16} />
            </button>
          )}
          {suffixIcon && !isPassword && !showPassword && (
            <span className="absolute right-3 text-[var(--td-text-color-placeholder)]">
              {suffixIcon}
            </span>
          )}
          {suffixText && (
            <span className="absolute right-3 text-[var(--td-text-color-secondary)] text-sm">
              {suffixText}
            </span>
          )}
        </div>
        {(showWordLimit || maxlength) && (
          <div className="flex justify-end mt-1 text-xs text-[var(--td-text-color-placeholder)]">
            {showWordLimit && (
              <span>
                {currentValue.length}
                {maxlength && ` / ${maxlength}`}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }
)

InputField.displayName = 'InputField'