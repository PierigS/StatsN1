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


interface StatDesc {
  type: string;
  fr: string;
}

function App() {
  const [data, setData] = useState<Record<string, ClubData> | null>(null);
  const [selectedClub, setSelectedClub] = useState<string>('FCSM');
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
  
    // Extract all clubs and their means for this statistic
    const clubsAndStats = Object.keys(data).map((club) => ({
      club,
      mean: data[club].means[statGroup]?.[stat]?.mean || 0, // Utiliser la chaîne optionnelle pour éviter les erreurs
    }));
  
    // Trier les clubs en fonction de la moyenne de la statistique
    // Si le type de stat est "negative", on inverse l'ordre du tri
    clubsAndStats.sort((a, b) => {
      return statType === 'negative' ? a.mean - b.mean : b.mean - a.mean;
    });
  
    // Trouver la position du club sélectionné dans ce classement
    return clubsAndStats.findIndex((clubData) => clubData.club === selectedClub) + 1; // Ajouter 1 pour convertir l'index en rang
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
          : 'rgba(106, 255, 106, 0.8)' // Si la stat est "negative" et le clubMean est inférieur à la moyenne
        : clubMean < overallMean
          ? 'rgba(220, 18, 18, 0.8)' // Si la stat est "positive" mais le clubMean est inférieur à la moyenne
          : 'rgba(106, 255, 106, 0.8)'; // Si la stat est "positive" et le clubMean est supérieur à la moyenne
        
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

    const barSize = 25;
    const gapSize = 25;
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
              width={200}
              tickLine={{ stroke: '#000' }}
              ticks={chartData.map((entry) => entry.statName)}
              tick={{ overflow: 'visible' }}
            />
            <Tooltip />
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
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div
      className="p-4 bg-gray-100"
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

