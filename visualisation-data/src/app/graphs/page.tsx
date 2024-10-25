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

interface StatDesc {
    [key: string]: string;
}

const chartConfig = {} satisfies ChartConfig

function Graphs() {
    const [data, setData] = useState<Record<string, ClubData> | null>(null);
    const [statDesc, setStatDesc] = useState<StatDesc | null>(null);
    const [statX, setStatX] = useState<string>('expectedGoals');
    const [statGroupX, setStatGroupX] = useState<string>('overview');
    const [statY, setStatY] = useState<string>('totalShotsOnGoal');
    const [statGroupY, setStatGroupY] = useState<string>('overview');

    useEffect(() => {
        // Charger les données des clubs
        fetch('/clubs.json')
        .then((response) => response.json())
        .then((data: Record<string, ClubData>) => {
            setData(data);
        })
        .catch((error) => console.error('Erreur lors du chargement des données :', error));
       
        // Charger les descriptions des stats
        fetch('/stats_desc.json')
        .then((response) => response.json())
        .then((desc: StatDesc) => {
            setStatDesc(desc);
        })
        .catch((error) => console.error('Erreur lors du chargement des descriptions :', error));
    }, []);

    if (!data || !statDesc) {
        return <p>Chargement des données...</p>;
    }
    // Préparer les données pour le ScatterChart
    const chartData = Object.keys(data).map((club) => {
        const clubStatX = data[club].means[statGroupX][statX].mean;
        const clubStatY = data[club].means[statGroupY][statY].mean;
        return {
            clubName: data[club].name,
            clubStatX,
            clubStatY,
            logoPath: `/clubs_logo/logo_${club}.png`,
        };
    });

    const calculateMedian = (values: number[]) => {
        const sortedValues = values.sort((a, b) => a - b);
        const mid = Math.floor(sortedValues.length / 2);
        return sortedValues.length % 2 !== 0
          ? sortedValues[mid]
          : (sortedValues[mid - 1] + sortedValues[mid]) / 2;
    };
    

    const renderChart = () => {
        const statXArray = chartData.map((club) => club.clubStatX);
        const statYArray = chartData.map((club) => club.clubStatY);
        
        const medianX = calculateMedian(statXArray);
        const medianY = calculateMedian(statYArray);


        const calculateBounds = (values: number[]) => {
            return [Math.round(Math.min(...values)*0.9*100)/100, Math.round(Math.max(...values)*1.1*100)/100];
        };

        const domainX = calculateBounds(statXArray);
        const domainY = calculateBounds(statYArray);
        const ticksX = Array.from({ length: 11 }, (_, i) => {
            return (domainX[0] + (domainX[1] - domainX[0]) * (i / 10)).toFixed(2); // 11 points pour 10 intervalles
        });
        const ticksY = Array.from({ length: 11 }, (_, i) => {
            return (domainY[0] + (domainY[1] - domainY[0]) * (i / 10)).toFixed(2); // 11 points pour 10 intervalles
        });

        const renderCustomizedPoints = (props: any) => {
            const { cx, cy, payload } = props; 

            return (
            <image
                xlinkHref={payload.logoPath}
                x={cx - 20} 
                y={cy - 25}
                height={40} 
                width={40}
                className='opacity-70 hover:opacity-100'
            />
            );
        };

        return (
            <div>
            <h1 className='font-bold text-2xl text-center'>{statDesc[statGroupY][statY].fr} en fonction de {statDesc[statGroupX][statX].fr}</h1>
            <ChartContainer config={chartConfig} className='w-[700px] h-[600px]'>
                <ScatterChart>
                <ReferenceLine 
                    x={medianX} 
                    stroke="red" 
                    strokeDasharray="3 3" 
                    label={{ position: 'insideBottomLeft', value: `${medianX.toFixed(2)} Médiane`, fill: 'black' }}
                />
                
                <ReferenceLine 
                    y={medianY} 
                    stroke="red" 
                    strokeDasharray="3 3" 
                    label={{ position: 'insideTopLeft', value: `${medianY.toFixed(2)} Médiane`, fill: 'black' }}
                />
                <XAxis 
                    type="number" 
                    dataKey="clubStatX"
                    width={100}
                    domain={domainX}
                    ticks={ticksX}
                    label={{ value: `${statDesc[statGroupX][statX].fr}`, position: 'insideBottom', offset: 0 }} 
                />
                <YAxis 
                    type="number" 
                    dataKey="clubStatY"
                    width={100}
                    domain={domainY}
                    ticks={ticksY}
                    label={{ value: `${statDesc[statGroupY][statY].fr}`, angle: -90, position: 'insideLeft' }} 
                />
                <ChartTooltip 
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            const { clubName, clubStatY, clubStatX } = payload[0].payload; // Extraire les données du club
                            return (
                                <div className="bg-white border border-gray-300 p-2 rounded shadow">
                                    <h4 className="font-bold">{clubName}</h4>
                                    <p>{statDesc[statGroupY][statY].fr} : {clubStatY.toFixed(2)}</p>
                                    <p>{statDesc[statGroupX][statX].fr} : {clubStatX.toFixed(2)}</p>
                                </div>
                            );
                        }
                        return null;
                    }} 
                />
                <Scatter 
                    name="Clubs" 
                    data={chartData} 
                    fill="#8884d8" 
                    shape={<Customized component={renderCustomizedPoints} />}
                />
                </ScatterChart>
            </ChartContainer>
            </div>
        );
    }

    return (
        <div>
            <div className='flex'>
                <SelectStats
                    onValueChange={(value:string) => {
                            setStatX(value.split(' - ')[1]);
                            setStatGroupX(value.split(' - ')[0]);
                        }}
                    statDesc={statDesc}
                    placeholder="Sélectionnez une stat en X"
                    label="Stat en X"
                />
                <SelectStats
                    onValueChange={(value:string) => {
                            setStatY(value.split(' - ')[1]);
                            setStatGroupY(value.split(' - ')[0]);
                        }}
                    statDesc={statDesc}
                    placeholder="Sélectionnez une stat en Y"
                    label="Stat en Y"
                />
            </div>
            
            {renderChart()}
            
        </div>
    )
    
}

export default Graphs;
