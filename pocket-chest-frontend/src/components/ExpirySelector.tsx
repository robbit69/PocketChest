'use client';

import { ValidityDays } from '@/lib/types';

interface ExpirySelectorProps {
  value: ValidityDays;
  onChange: (days: ValidityDays) => void;
}

const expiryOptions = [
  { value: 1 as ValidityDays, label: '1 天', description: '1 天后到期' },
  { value: 3 as ValidityDays, label: '3 天', description: '3 天后到期' },
  { value: 7 as ValidityDays, label: '7 天', description: '7 天后到期' },
  { value: 15 as ValidityDays, label: '15 天', description: '15 天后到期' },
  { value: -1 as ValidityDays, label: '永久', description: '永不过期' },
];

export function ExpirySelector({ value, onChange }: ExpirySelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        有效期
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
        {expiryOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              p-3 rounded-lg border text-left transition-colors
              ${value === option.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <div className="font-medium text-sm">{option.label}</div>
            <div className="text-xs text-gray-500 mt-1">{option.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}