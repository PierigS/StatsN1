// src/components/select-custom.tsx

import React from 'react';

interface SelectCustomProps {
    options: string[];
    placeholder?: string;
    onSelect: (value: string) => void;
}

const SelectCustom: React.FC<SelectCustomProps> = ({ options, placeholder = "Sélectionnez une option", onSelect }) => {
    return (
        <select
            onChange={(e) => onSelect(e.target.value)}
            defaultValue=""
            className="border p-2 rounded-md"
        >
            <option value="" disabled>
                {placeholder}
            </option>
            {options.map((option) => (
                <option key={option} value={option}>
                    {option}
                </option>
            ))}
        </select>
    );
};

export default SelectCustom;
