import React, { useRef, useLayoutEffect, useEffect, useState } from 'react';

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | string | null | undefined;
  onChange: (value: string) => void;
  allowDecimals?: boolean;
  allowNegative?: boolean;
}

export function formatNumberWithCommas(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const stringValue = String(value).replace(/,/g, '');
  if (stringValue === '-' || stringValue === '.') return stringValue;
  if (stringValue.endsWith('.')) {
    const intPart = stringValue.slice(0, -1);
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${formattedInt}.`;
  }

  const parts = stringValue.split('.');
  const intPart = parts[0] || '';
  const isNegative = intPart.startsWith('-');
  const cleanInt = isNegative ? intPart.slice(1) : intPart;
  
  const formattedInt = cleanInt.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const signedInt = isNegative ? `-${formattedInt}` : formattedInt;

  if (parts.length > 1) {
    return `${signedInt}.${parts[1]}`;
  }
  return signedInt;
}

export function cleanNumberValue(formattedStr: string): string {
  return formattedStr.replace(/,/g, '').trim();
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  allowDecimals = true,
  allowNegative = false,
  className = '',
  placeholder = '0',
  onFocus,
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cursorPos, setCursorPos] = useState<number | null>(null);

  const displayValue = formatNumberWithCommas(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const target = e.target;
    const oldCursor = target.selectionStart || 0;

    // Count how many non-comma characters were before cursor
    const digitsBeforeCursor = rawInput.slice(0, oldCursor).replace(/,/g, '').length;

    // Filter valid characters
    let cleaned = rawInput.replace(/,/g, '');
    if (!allowNegative) {
      cleaned = cleaned.replace(/-/g, '');
    }
    if (!allowDecimals) {
      cleaned = cleaned.replace(/\./g, '');
    } else {
      // Keep at most one dot
      const dotIndex = cleaned.indexOf('.');
      if (dotIndex !== -1) {
        cleaned =
          cleaned.slice(0, dotIndex + 1) +
          cleaned.slice(dotIndex + 1).replace(/\./g, '');
      }
    }

    // Only allow numbers, dot, minus
    cleaned = cleaned.replace(/[^0-9.-]/g, '');

    // Format new display value to calculate new cursor position
    const formatted = formatNumberWithCommas(cleaned);

    // Find new cursor index corresponding to digitsBeforeCursor
    let newCursor = 0;
    let countedDigits = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (countedDigits >= digitsBeforeCursor) {
        break;
      }
      if (formatted[i] !== ',') {
        countedDigits++;
      }
      newCursor = i + 1;
    }

    setCursorPos(newCursor);
    onChange(cleaned);
  };

  useLayoutEffect(() => {
    if (cursorPos !== null && inputRef.current) {
      inputRef.current.setSelectionRange(cursorPos, cursorPos);
      setCursorPos(null);
    }
  }, [cursorPos, displayValue]);

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={displayValue || ''}
      onChange={handleChange}
      placeholder={placeholder || '0'}
      onFocus={(e) => {
        e.target.select();
        if (onFocus) onFocus(e);
      }}
      className={className}
      {...props}
    />
  );
};
