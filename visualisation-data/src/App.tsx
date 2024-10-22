import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';

// Définir les types pour les données
interface Stat {
  mean: number;
}

interface ClubData {
  means: Record<string, Record<string, Stat>>;
}

interface ChartData {
  statName: string;
  difference: number;
  clubMean: string;
  color: string;
}

function App() {
  const [data, setData] = useState<Record<string, ClubData> | null>(null);
  const [selectedClub, setSelectedClub] = useState<string>('FCSM');
  const [allMeans, setAllMeans] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    fetch('/clubs.json')
      .then((response) => response.json())
      .then((data: Record<string, ClubData>) => {
        setData(data);
        calculateOverallMeans(data);
      })
      .catch((error) => console.error('Erreur lors du chargement des données :', error));
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

  const renderChartForStatGroup = (statGroup: string) => {
    const clubMeans = data[selectedClub].means[statGroup];

    const chartData: ChartData[] = Object.keys(clubMeans).map((stat) => {
      const clubMean = clubMeans[stat].mean;
      const overallMean = parseFloat(allMeans[statGroup][stat]);
      const difference = ((clubMean - overallMean) / overallMean * 100).toFixed(2);
      return {
        statName: stat,
        difference: parseFloat(difference),
        clubMean: clubMean.toFixed(2),
        color: clubMean < overallMean ? 'rgba(255, 99, 132, 0.6)' : 'rgba(75, 192, 192, 0.6)',
      };
    });

    const barSize = 20;
    const gapSize = 20;
    const chartHeight = chartData.length * (barSize + gapSize);

    return (
      <div key={statGroup} >
        <h2 className='font-bold text-xl'>{statGroup}</h2>
        <ResponsiveContainer width="50%" height={chartHeight}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 50, left: 50, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[-200, 200]} axisLine={{ stroke: '#000' }} />
            <YAxis
              type="category"
              dataKey="statName"
              width={150}
              tickLine={{ stroke: '#000' }}
              ticks={chartData.map((entry) => entry.statName)}
            />
            <Tooltip />
            <Bar dataKey="difference" barSize={20}>
              <LabelList dataKey="clubMean" position="right" formatter={(value: number) => `${value}`} />
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div
      className="p-4"
    >
      <label htmlFor="club-selector" className="font-bold">Sélectionne un club :</label>
      <select
        id="club-selector"
        value={selectedClub}
        onChange={(e) => setSelectedClub(e.target.value)}
      >
        {Object.keys(data).map((club) => (
          <option key={club} value={club}>
            {club}
          </option>
        ))}
      </select>

      <h1 className='font-bold text-2xl'>Différences des statistiques de {selectedClub} par rapport à la moyenne générale.</h1>
      <h5 className='font-bold text-l'>Les valeurs sont exprimées en pourcentage de différence par rapport à la moyenne des clubs.</h5>
      <div>
        {availableStatGroups.map((statGroup) => renderChartForStatGroup(statGroup))}
      </div>
    </div>
  );
}

export default App;

