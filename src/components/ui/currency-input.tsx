import * as React from "react"
import { Input } from "@/components/ui/input"

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | ''
  onChangeValue: (value: number | '') => void
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChangeValue, onBlur, onFocus, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('')
    const [isFocused, setIsFocused] = React.useState(false)

    // Sync from prop value when not focused
    React.useEffect(() => {
      if (!isFocused) {
        if (value === '' || value === null || value === undefined) {
          setDisplayValue('')
        } else {
          setDisplayValue(Number(value).toLocaleString('en-US'))
        }
      }
    }, [value, isFocused])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Remove all commas
      const raw = e.target.value.replace(/,/g, '')
      if (raw === '') {
        setDisplayValue('')
        onChangeValue('')
        return
      }
      
      // Allow valid numbers
      if (!isNaN(Number(raw)) && /^\d*\.?\d*$/.test(raw)) {
        // Only format if not currently typing a decimal point
        if (raw.endsWith('.')) {
          setDisplayValue(e.target.value)
        } else {
          setDisplayValue(e.target.value) 
        }
        onChangeValue(Number(raw))
      }
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      if (value !== '' && value !== null && value !== undefined) {
        setDisplayValue(Number(value).toLocaleString('en-US'))
      }
      onBlur?.(e)
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      // When focused, show raw number so user can edit easily without jumping cursors
      setDisplayValue(value === '' ? '' : String(value))
      onFocus?.(e)
    }

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
      />
    )
  }
)
CurrencyInput.displayName = "CurrencyInput"
