import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';

function App() {
  const [data, setData] = useState(null);
  const [selectedClub, setSelectedClub] = useState('FCSM');
  const [allMeans, setAllMeans] = useState({});

  useEffect(() => {
    fetch('/clubs.json')
      .then((response) => response.json())
      .then((data) => {
        setData(data);
        calculateOverallMeans(data);
      })
      .catch((error) => console.error('Erreur lors du chargement des données :', error));
  }, []);

  const calculateOverallMeans = (data) => {
    const statGroups = {};
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

    const overallMeans = {};
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

  const renderChartForStatGroup = (statGroup) => {
    const clubMeans = data[selectedClub].means[statGroup];

    const chartData = Object.keys(clubMeans).map((stat) => {
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

    const barSize = 20; // Largeur des barres
    const gapSize = 20; // Espace entre les barres
    const chartHeight = chartData.length * (barSize + gapSize); // Calcul dynamique de la hauteur du graphique

    return (
      <div key={statGroup} style={{ marginBottom: '50px' }}>
        <h2>{statGroup}</h2>
        <ResponsiveContainer width="100%" height={chartHeight}>

          <BarChart 
            data={chartData} 
            layout="vertical" 
            margin={{ top: 5, right: 50, left: 50, bottom: 5 }}
          > {/* Ajustement des marges */}
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[-200, 200]} axisLine={{ stroke: '#000' }} />
            <YAxis type="category" dataKey="statName" width={150} tickLine={{ stroke: '#000' }} ticks={chartData.map(entry => entry.statName)} />
            <Tooltip />
            <Bar dataKey="difference" barSize={20}>
              <LabelList dataKey="clubMean" position="right" formatter={(value) => `${value}`} />
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
    <div className="App" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <label htmlFor="club-selector">Sélectionne un club :</label>
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

      <h1>Différences des statistiques de {selectedClub} par rapport à la moyenne générale</h1>
      <h5>Les valeurs sont exprimées en pourcentage de différence par rapport à la moyenne des clubs</h5>

      {/* Affichage de tous les graphiques pour chaque groupe de statistiques */}
      {availableStatGroups.map((statGroup) => renderChartForStatGroup(statGroup))}
    </div>
  );
}

export default App;
