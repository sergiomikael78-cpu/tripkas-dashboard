import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | ''
  onChangeValue: (value: number | '') => void
}

const formatIndonesianCurrency = (num: number | ''): string => {
  if (num === '' || num === null || num === undefined || isNaN(Number(num))) return ''
  return Number(num).toLocaleString('id-ID')
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChangeValue, onBlur, onFocus, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('')
    const [isFocused, setIsFocused] = React.useState(false)

    // Sync from prop value when not focused or when prop value changes
    React.useEffect(() => {
      if (!isFocused) {
        setDisplayValue(formatIndonesianCurrency(value))
      }
    }, [value, isFocused])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Strip all non-digit characters to extract pure numeric value
      const rawDigits = e.target.value.replace(/\D/g, '')
      
      if (rawDigits === '') {
        setDisplayValue('')
        onChangeValue('')
        return
      }

      const numericVal = Number(rawDigits)
      if (!isNaN(numericVal)) {
        // Format display value immediately with Indonesian dot separator (e.g., 500.000)
        setDisplayValue(formatIndonesianCurrency(numericVal))
        onChangeValue(numericVal)
      }
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      setDisplayValue(formatIndonesianCurrency(value))
      onBlur?.(e)
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      // On focus, show formatted value so user sees clean dots
      if (value !== '' && value !== null && value !== undefined) {
        setDisplayValue(formatIndonesianCurrency(value))
      }
      onFocus?.(e)
    }

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="numeric"
        pattern="[0-9.]*"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        className={cn("font-mono tabular-nums", className)}
      />
    )
  }
)
CurrencyInput.displayName = "CurrencyInput"
