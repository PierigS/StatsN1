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
  "goals": "Buts", 
  "expectedGoals": "xG", 
  "accurateLongBalls": "Passes prof. réussies (%)", 
  "touches": "Touches",
  "wonContest": "Duels gagnés (%)", 
  "wasFouled": "Fautes subies", 
  "possessionLostCtrl": "Pertes de balle", 
  "goalAssist": "Passes décisives"
}

// Fonction pour générer les données du joueur
const data_player_off = (playerData, selectedPlayerId) => {
  const keysToSum = [
    "goals", "expectedGoals", "accurateLongBalls", "totalLongBalls", "touches",
    "wonContest", "totalContest", "wasFouled", "possessionLostCtrl", "goalAssist", "minutesPlayed"
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
      goals: roundToTwoDigits((totalStats.goals * 90) / minutesPlayed),
      expectedGoals: roundToTwoDigits((totalStats.expectedGoals * 90) / minutesPlayed),
      accurateLongBalls: roundToTwoDigits(100*totalStats.accurateLongBalls / totalStats.totalLongBalls || 0) ,
      touches: roundToTwoDigits((totalStats.touches * 90) / minutesPlayed),
      wonContest: roundToTwoDigits(100* totalStats.wonContest / totalStats.totalContest || 0),
      wasFouled: roundToTwoDigits((totalStats.wasFouled * 90) / minutesPlayed),
      possessionLostCtrl: roundToTwoDigits((totalStats.possessionLostCtrl * 90) / minutesPlayed),
      goalAssist: roundToTwoDigits((totalStats.goalAssist * 90) / minutesPlayed),
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
    goals: [], expectedGoals: [], accurateLongBalls: [], touches: [],
    wonContest: [], wasFouled: [], possessionLostCtrl: [], goalAssist: []
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
  const dataPlayerOff = Object.keys(selectedPlayerMetrics).map(key => {
    if (key === "minutesPlayed") return null; // Ignorer "minutesPlayed"
    return {
      subject: key,
      base: maxMetrics[key],
      A: selectedPlayerMetrics[key],
      B: medianMetrics[key],
      description: description[key],
    };
  }).filter(item => item !== null); // Filtrer les null (minutesPlayed)

  return dataPlayerOff;
};

// Fonction de normalisation (basée sur les données)
const lcm = (a, b) => (a * b) / gcd(a, b);
const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

export default function RadarOff({ playerData, selectedPlayerId }) {
  const dataOff = data_player_off(playerData, selectedPlayerId);

  // Normalisation des données
  const base = dataOff.map((item) => item.base).reduce(lcm);
  const normalizer = Object.fromEntries(
    dataOff.map((item) => [item.subject, base / item.base])
  );

  const normalizedData = dataOff.map((v) => ({
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
                    x={index === 3 ? x-30 : index === 5 ? x+50 : x}
                    y={index === 3 || index === 4 || index === 5 ? y+30 : y-20}
                    textAnchor={textAnchor}
                    transform={
                      index === 1 ? `rotate(45, ${x}, ${y-15})` :
                      index === 2 ? `rotate(90, ${x+40}, ${y-40})` :
                      index === 3 ? `rotate(-45, ${x}, ${y})` :
                      index === 4 ? `rotate(0, ${x}, ${y})` :
                      index === 5 ? `rotate(45, ${x}, ${y})` :
                      index === 6 ? `rotate(270, ${x-30}, ${y-30})` :
                      index === 7 ? `rotate(315, ${x-30}, ${y-70})` :
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
