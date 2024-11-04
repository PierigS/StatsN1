// src/components/select-custom.tsx

import React from 'react';

interface SelectOption {
    value: number;
    label: string;
}

interface SelectCustomProps {
    options: SelectOption[];
    placeholder?: string;
    onSelect: (value: string) => void;
}

const SelectCustom: React.FC<SelectCustomProps> = ({ options, placeholder, onSelect }) => {
    // Trier les options par ordre alphabétique de leur label
    const sortedOptions = [...options].sort((a, b) => a.label.localeCompare(b.label));

    return (
        <select
            onChange={(e) => onSelect(e.target.value)}
            defaultValue=""
            className="border p-2 rounded-md">
            <option value="">{placeholder}</option>
            {sortedOptions.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
};

export default SelectCustom;
