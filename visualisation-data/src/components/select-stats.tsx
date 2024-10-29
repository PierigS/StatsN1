

import React from 'react';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectGroup,
    SelectLabel,
    SelectItem,
} from '@/components/ui/select';

interface SelectStatsProps {
    onValueChange: (value: string) => void;
    statDesc: Record<string, Record<string, any>>; // Ajustez le type en fonction de la structure de statDesc
    placeholder?: string;
    label: string; // Ajoutez une propriété pour le label
}

const SelectStats: React.FC<SelectStatsProps> = ({
    onValueChange,
    statDesc,
    placeholder = 'Sélectionnez une statistique',
    label,
}) => {
    return (
        <div>
            <label htmlFor="statX">{label}</label>
            <Select onValueChange={onValueChange}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder={placeholder}
                     />
                </SelectTrigger>
                <SelectContent>
                    {Object.keys(statDesc).map((statGroup) => (
                        <SelectGroup key={statGroup}>
                            <SelectLabel>{statGroup}</SelectLabel>
                            {Object.keys(statDesc[statGroup]).map((stat) => (
                                <SelectItem key={stat} value={`${statGroup} - ${stat}`}>
                                    {statDesc[statGroup][stat].fr}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};

export default SelectStats;
