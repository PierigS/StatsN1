'use client';

import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Customized } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import SelectStats from '@/components/select-stats';

interface Stat {
    mean: number;
}

interface ClubData {
    means: Record<string, Record<string, Stat>>;
    name: string;
}


const chartConfig = {} satisfies ChartConfig

function Graphs() {
    const [data, setData] = useState<Record<string, ClubData> | null>(null);

    useEffect(() => {
        // Charger les données des clubs
        fetch('/clubs.json')
        .then((response) => response.json())
        .then((data: Record<string, ClubData>) => {
            setData(data);
        })
        .catch((error) => console.error('Erreur lors du chargement des données :', error));
    }, []);

    

    return (
        <div>
        </div>
    )
    
}

export default Graphs;
