import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  Legend,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

// Fonction pour calculer la médiane
const calculateMedian = (values) => {
  const sortedValues = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sortedValues.length / 2);
  return sortedValues.length % 2 !== 0
    ? sortedValues[mid]
    : (sortedValues[mid - 1] + sortedValues[mid]) / 2;
};

const description = {
  "errorLeadToAShot": "Erreur menant à un but",
  "interceptionWon": "Interceptions",
  "accuratePass": "Passes réussies (%)",
  "duelWon": "Duels gagnés (%)",
  "aerialWon": "Duels aériens gagnés (%)",
  "fouls": "Fautes",
  "challengeLost": "Dribbles subis",
  "totalTackle": "Tacles",
}

const data_player_def = (playerData, selectedPlayerId) => {
  const keysToSum = [
    "errorLeadToAShot", "interceptionWon", "duelWon", "duelLost", "totalTackle",
    "aerialWon", "aerialLost", "challengeLost", "fouls", "accuratePass", "totalPass", "minutesPlayed"
  ];

  const calculateMetrics = (playerData) => {
    const totalStats = keysToSum.reduce((acc, key) => {
      acc[key] = 0;
      return acc;
    }, {});

    playerData.games.forEach(game => {
      keysToSum.forEach(key => {
        if (game.statistics[key] !== undefined) {
          totalStats[key] += game.statistics[key];
        }
      });
    });

    const minutesPlayed = totalStats.minutesPlayed || 1;
    const roundToTwoDigits = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

    return {
      errorLeadToAShot: roundToTwoDigits((totalStats.errorLeadToAShot * 90) / minutesPlayed),
      interceptionWon: roundToTwoDigits((totalStats.interceptionWon * 90) / minutesPlayed),
      accuratePass: roundToTwoDigits(100*totalStats.accuratePass / totalStats.totalPass || 0) ,
      duelWon: roundToTwoDigits((totalStats.duelWon/(totalStats.duelWon+totalStats.duelLost)) || 0),
      aerialWon: roundToTwoDigits((totalStats.aerialWon/(totalStats.aerialWon+totalStats.aerialLost)) || 0),
      fouls: roundToTwoDigits((totalStats.fouls * 90) / minutesPlayed),
      challengeLost: roundToTwoDigits((totalStats.challengeLost * 90) / minutesPlayed),
      totalTackle: roundToTwoDigits((totalStats.totalTackle * 90) / minutesPlayed),
      minutesPlayed: totalStats.minutesPlayed, 
    };
  };

  const selectedPlayerMetrics = calculateMetrics(playerData[selectedPlayerId.toString()]);
  const selectedPlayerPosition = playerData[selectedPlayerId.toString()].player.position;

  // Filtrer les joueurs ayant la même position et au moins 300 minutes jouées
  const playersWithSamePosition = Object.keys(playerData).filter(playerId => {
    const player = playerData[playerId];
    const metrics = calculateMetrics(player);
    return (
      player.player.position === selectedPlayerPosition &&
      metrics.minutesPlayed > 300
    );
  });

  const metricsByCategory = {
    errorLeadToAShot: [], interceptionWon: [], accuratePass: [], duelWon: [],
    aerialWon: [], fouls: [], challengeLost: [], totalTackle: []
  };

  // Construire les valeurs des métriques pour chaque catégorie
  playersWithSamePosition.forEach(playerId => {
    const metrics = calculateMetrics(playerData[playerId]);
    Object.keys(metricsByCategory).forEach(metric => {
      metricsByCategory[metric].push(metrics[metric]);
    });
  });

  // Calculer la médiane, minimum et maximum pour chaque métrique
  const medianMetrics = Object.keys(metricsByCategory).reduce((acc, key) => {
    acc[key] = calculateMedian(metricsByCategory[key]);
    return acc;
  }, {});

  const maxMetrics = Object.keys(metricsByCategory).reduce((acc, key) => {
    acc[key] = Math.max(...metricsByCategory[key]);
    return acc;
  }, {});

  // Construire la variable dataPlayerOff
  const dataPlayerDef = Object.keys(selectedPlayerMetrics).map(key => {
    if (key === "minutesPlayed") return null; // Ignorer "minutesPlayed"
    return {
      subject: key,
      base: maxMetrics[key],
      A: selectedPlayerMetrics[key],
      B: medianMetrics[key],
      description: description[key],
    };
  }).filter(item => item !== null); // Filtrer les null (minutesPlayed)

  return dataPlayerDef;
};

// Fonction de normalisation (basée sur les données)
const lcm = (a, b) => (a * b) / gcd(a, b);
const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

export default function RadarDef({ playerData, selectedPlayerId }) {
  const dataDef = data_player_def(playerData, selectedPlayerId);

  // Normalisation des données
  const base = dataDef.map((item) => item.base).reduce(lcm);
  const normalizer = Object.fromEntries(
    dataDef.map((item) => [item.subject, base / item.base])
  );

  const normalizedData = dataDef.map((v) => ({
    ...v,
    base: 1,
    A: v.A/v.base,
    B: v.B/v.base,
    valA: v.A,
    valB: v.B
  }));
  

  const calculateTicks = (domain, tickCount) => {
    const [min, max] = domain;
    const step = (max - min) / (tickCount - 1);
    return Array.from({ length: tickCount }, (_, i) => Math.round((min + i * step) * 100) / 100);
  };

  const CustomTick = ({ x, y, textAnchor, payload, idx, ...props }) => {
    return (
      <text 
        x={x} 
        y={y} 
        textAnchor={textAnchor} 
        transform={
          idx === 1 ? `rotate(45, ${x}, ${y})` :
          idx === 2 ? `rotate(90, ${x}, ${y})` :
          idx === 3 ? `rotate(315, ${x}, ${y})` :
          idx === 5 ? `rotate(45, ${x}, ${y})` :
          idx === 6 ? `rotate(270, ${x}, ${y})` :
          idx === 7 ? `rotate(315, ${x}, ${y})` :
           `rotate(0, ${x}, ${y})`
        } 
        {...props}
        fill='#555'
        className='text-xs'
        >
        {payload.value === 0 ? '' : payload.value}
      </text>
    );
  };

  return (
    <>
      <div style={{ position: "absolute" }}>
        <RadarChart
          cx={400}
          cy={300}
          outerRadius={250}
          width={850}
          height={650}
          data={normalizedData}
        >
          <PolarGrid polarRadius={[250/4, 125, 3*250/4,  250]} className="fill-stone-400 opacity-20" radialLines={false}/>
          <Radar
            name={playerData[selectedPlayerId.toString()].player.name}
            dataKey="A"
            stroke="#57c76f"
            fill="#57c76f"
            fillOpacity={0.5}
          />
          <Radar
            name="Joueur médian"
            dataKey="B"
            stroke="#3c3fba"
            fill="#3c3fba"
            fillOpacity={0.5}
          />
          <Legend />
      </RadarChart>
    </div>
      {normalizedData.map(({ subject }, idx) => (
        <div style={{ position: "absolute" }}>
          <RadarChart
            cx={400}
            cy={300}
            outerRadius={250}
            width={850}
            height={700}
            data={normalizedData}
          >
            <PolarAngleAxis 
              dataKey="subject"
              tick={({ x, y, textAnchor, value, index, ...props }) => {
                const data = normalizedData[index]
                return (
                  <text
                    x={index === 3 ? x-60 : index === 5 ? x+20 : x}
                    y={index === 3 || index === 4 || index === 5 ? y+25 : y-20}
                    textAnchor={textAnchor}
                    transform={
                      index === 1 ? `rotate(45, ${x+20}, ${y-50})` :
                      index === 2 ? `rotate(90, ${x+30}, ${y-40})` :
                      index === 3 ? `rotate(-45, ${x}, ${y})` :
                      index === 4 ? `rotate(0, ${x}, ${y})` :
                      index === 5 ? `rotate(45, ${x}, ${y})` :
                      index === 6 ? `rotate(270, ${x-20}, ${y-30})` :
                      index === 7 ? `rotate(315, ${x}, ${y-30})` :
                      `rotate(0, ${x}, ${y})`
                    }
                    {...props}
                    className="font-sans font-light text-lg"
                  >
                    {data.description}
                  </text>
                )
              }}
            />
            <PolarRadiusAxis
              angle={90 - idx * (360 / normalizedData.length)}
              domain={[0, Math.round(100*base / normalizer[subject])/100]}
              ticks={calculateTicks([0, Math.round(100 * base / normalizer[subject]) / 100], 5)}
              axisLine={false}
              orientation='middle'
              className=""
              tick={<CustomTick idx={idx}/>}
            />
            <Legend />
          </RadarChart>
        </div>
      ))}
    </>
  );
}