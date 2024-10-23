'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, LabelList, Cell } from 'recharts';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LegendProps } from 'recharts';

// Définir les types pour les données
interface Stat {
  mean: number;
}

interface ClubData {
  means: Record<string, Record<string, Stat>>;
  name: string;
}

interface ChartData {
  statName: string;
  difference: number;
  clubMean: string;
  color: string;
}


interface StatDesc {
  type: string;
  fr: string;
}
const chartConfig = {
    desktop: {
      label: "Desktop",
      color: "#2563eb",
    },
    mobile: {
      label: "Mobile",
      color: "#60a5fa",
    },
} satisfies ChartConfig

function Main() {
  const [data, setData] = useState<Record<string, ClubData> | null>(null);
  const [selectedClub, setSelectedClub] = useState<string>('FCSM');
  const [selectedClubName, setSelectedClubName] = useState<string>('Sochaux');
  const [allMeans, setAllMeans] = useState<Record<string, Record<string, string>>>({});
  const [statDescriptions, setStatDescriptions] = useState<Record<string, Record<string, StatDesc>>>({});

  useEffect(() => {
    fetch('/clubs.json')
      .then((response) => response.json())
      .then((data: Record<string, ClubData>) => {
        setData(data);
        calculateOverallMeans(data);
      })
      .catch((error) => console.error('Erreur lors du chargement des données :', error));
    
      // Charger le fichier stats_desc.json
    fetch('/stats_desc.json')
    .then((response) => response.json())
    .then((descData: Record<string, Record<string, StatDesc>>) => {
      setStatDescriptions(descData); 
    })
    .catch((error) => console.error('Erreur lors du chargement des descriptions des stats :', error));
  }, []);

  const calculateOverallMeans = (data: Record<string, ClubData>) => {
    const statGroups: Record<string, Record<string, number>> = {};
    let clubCount = 0;

    Object.keys(data).forEach((club) => {
      const statGroupKeys = Object.keys(data[club].means);
      statGroupKeys.forEach((group) => {
        const stats = data[club].means[group];
        Object.keys(stats).forEach((stat) => {
          if (!statGroups[group]) statGroups[group] = {};
          if (!statGroups[group][stat]) statGroups[group][stat] = 0;
          statGroups[group][stat] += stats[stat].mean;
        });
      });
      clubCount++;
    });

    const overallMeans: Record<string, Record<string, string>> = {};
    Object.keys(statGroups).forEach((group) => {
      overallMeans[group] = {};
      Object.keys(statGroups[group]).forEach((stat) => {
        overallMeans[group][stat] = (statGroups[group][stat] / clubCount).toFixed(2);
      });
    });

    setAllMeans(overallMeans);
  };

  

  if (!data || !allMeans) {
    return <p>Chargement des données...</p>;
  }

  const availableStatGroups = Object.keys(data[selectedClub].means);

  const calculateRankForStat = (stat: string, statGroup: string, statType: string): number => {
    if (!data) return 0;
  
    const clubsAndStats = Object.keys(data).map((club) => ({
      club,
      mean: data[club].means[statGroup]?.[stat]?.mean || 0,
    }));
  
    // Trier les clubs en fonction de la moyenne de la statistique
    // Si le type de stat est "negative", on inverse l'ordre du tri
    clubsAndStats.sort((a, b) => {
      return statType === 'negative' ? a.mean - b.mean : b.mean - a.mean;
    });
  
    // Trouver la position du club sélectionné dans ce classement
    return clubsAndStats.findIndex((clubData) => clubData.club === selectedClub) + 1;
  };
  

  const renderChartForStatGroup = (statGroup: string) => {
    const clubMeans = data[selectedClub].means[statGroup];

    const chartData: ChartData[] = Object.keys(clubMeans).map((stat) => {
      const clubMean = clubMeans[stat].mean;
      const overallMean = parseFloat(allMeans[statGroup][stat]);
      const difference = ((clubMean - overallMean) / overallMean * 100).toFixed(2);
      
      // Utilise le nom français de la stat à partir de stats_desc.json
      const statName = statDescriptions[statGroup]?.[stat]?.fr || stat;
      const statType = statDescriptions[statGroup]?.[stat]?.type;

      // Inverse la couleur si le type est "negative"
      const color = statType === 'negative'
        ? clubMean > overallMean
          ? 'rgba(220, 18, 18, 0.8)' // Si la stat est "negative" mais le clubMean est supérieur à la moyenne
          : 'rgba(18, 220, 18, 0.8)' // Si la stat est "negative" et le clubMean est inférieur à la moyenne
        : clubMean < overallMean
          ? 'rgba(220, 18, 18, 0.8)' // Si la stat est "positive" mais le clubMean est inférieur à la moyenne
          : 'rgba(18, 220, 18, 0.8)'; // Si la stat est "positive" et le clubMean est supérieur à la moyenne
        
      const clubStatRank = calculateRankForStat(stat, statGroup, statType);
      const label = `${clubMean}-${clubStatRank}${clubStatRank===1 ? 'er' : 'ème'}`;

      return {
        statName: statName,
        difference: parseFloat(difference),
        clubMean: clubMean.toFixed(2),
        label: label,
        rank: clubStatRank, 

        color: color
      };
    });

    const barSize = 40;
    const gapSize = 1;
    const chartHeight = chartData.length * (barSize + gapSize);

    return (
      <div key={statGroup} >
        <h2 className='font-bold text-xl'>{statGroup}</h2>
        <ChartContainer config={chartConfig} className={`w-[750px]`} style={{ height: `${chartHeight}px`}}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 50, left: 50, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3"  />
            <XAxis type="number" domain={[-200, 200]} axisLine={{ stroke: '#000' }} />
            <YAxis
              type="category"
              dataKey="statName"
              width={250}
              tickLine={{ stroke: '#000' }}
              ticks={chartData.map((entry) => entry.statName)}
              tick={{ overflow: 'visible' }}
              tickMargin={5}
            />
            <ReferenceLine x={0} stroke="lightgray" strokeWidth={1} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="difference" barSize={20}>
              <LabelList 
                dataKey="label" 
                position="right"
              />
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
    );
  };

  return (
    <div
      className="p-4"
    >
        <div className='flex flex-column'>
            <label htmlFor="club-selector" className="font-bold w-[200px] p-1">Sélectionne un club :</label>
            <Select onValueChange={(value:string) => {
                    setSelectedClub(value);
                    setSelectedClubName(data[value]['name']);
                    }}>
                <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder={`${selectedClub}`} />
                </SelectTrigger>
                <SelectContent>
                    {Object.keys(data).map((club) => (
                        <SelectItem key={club} value={club}>
                            {club}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      

      <h1 className='font-bold text-2xl text-center'>Différences des statistiques de {selectedClubName} par rapport à la moyenne générale.</h1>
      <h5 className='font-bold text-l text-center'>Les valeurs sont exprimées en pourcentage de différence par rapport à la moyenne des clubs.</h5>
      <div className=''>
        {availableStatGroups.map((statGroup) => renderChartForStatGroup(statGroup))}
      </div>
    </div>
  );
}

export default Main;

