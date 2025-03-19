import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = ({ value, onValueChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSelect = (optionValue) => {
    onValueChange(optionValue);
    setIsOpen(false);
  };
  
  const selectedOption = options?.find(option => option.value === value);
  
  return (
    <div className="relative">
      <button
        type="button"
        className="w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOption?.label || placeholder}
        <ChevronDown 
          className={`h-4 w-4 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-input bg-popover shadow-md">
          <ul className="py-1 max-h-60 overflow-auto">
            {options?.map((option) => (
              <li
                key={option.value}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export { Select };