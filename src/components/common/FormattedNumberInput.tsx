import React, { useRef } from 'react';
import { formatWithCommas } from '../../utils/formatters';

interface FormattedNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | string | null | undefined;
  onChangeValue?: (rawNumericString: string, numericValue: number) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FormattedNumberInput: React.FC<FormattedNumberInputProps> = ({
  value,
  onChangeValue,
  onChange,
  className = '',
  placeholder = '0',
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = formatWithCommas(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Strip commas
    const unformatted = rawVal.replace(/,/g, '');

    // Allow empty or negative sign or valid decimal string
    if (unformatted !== '' && unformatted !== '-' && !/^-?\d*\.?\d*$/.test(unformatted)) {
      return;
    }

    // Save cursor position
    const cursor = e.target.selectionStart || 0;
    const digitsBeforeCursor = rawVal.slice(0, cursor).replace(/[^0-9.-]/g, '').length;

    const formatted = formatWithCommas(unformatted);
    const num = parseFloat(unformatted) || 0;

    if (onChangeValue) {
      onChangeValue(unformatted, num);
    }
    if (onChange) {
      onChange(e);
    }

    // Keep cursor at the right position after commas get recalculated
    requestAnimationFrame(() => {
      if (inputRef.current) {
        let count = 0;
        let newPos = formatted.length;
        for (let i = 0; i < formatted.length; i++) {
          if (/[0-9.-]/.test(formatted[i])) {
            count++;
          }
          if (count === digitsBeforeCursor) {
            newPos = i + 1;
            break;
          }
        }
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    });
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      placeholder={placeholder || '0'}
      value={displayValue || ''}
      onFocus={(e) => e.target.select()}
      onChange={handleChange}
      className={className}
      {...props}
    />
  );
};

export default FormattedNumberInput;
