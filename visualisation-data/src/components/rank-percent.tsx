"use client";

import { TrendingUp } from "lucide-react";
import { Cell, Label, LabelList, Pie, PieChart, Sector } from "recharts";
import { PieSectorDataItem } from "recharts/types/polar/Pie";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const getStepColor = (value: number): string => {
    if (value <= 25) {
        return "#cc0000"; // Rouge
    } else if (value <= 50) {
        return "#e69500"; // Orange
    } else if (value <= 75) {
        return "#e6e600"; // Jaune
    } else {
        return "#009900"; // Vert
    }
};

const chartConfig = {
    
} satisfies ChartConfig

const description = {
    "goals": "Buts", 
    "expectedGoals": "xG", 
    "accurateLongBalls": "Passes prof. réussies", 
    "touches": "Touches",
    "wonContest": "Dribbles réussis", 
    "wasFouled": "Fautes subies", 
    "possessionLostCtrl": "Pertes de balle", 
    "goalAssist": "Passes décisives",
    "errorLeadToAShot": "Erreur menant à un but",
    "interceptionWon": "Interceptions",
    "accuratePass": "Passes réussies",
    "duelWon": "Duels gagnés",
    "aerialWon": "Duels aériens gagnés",
    "fouls": "Fautes",
    "challengeLost": "Dribbles subis",
    "totalTackle": "Tacles",
}
  
const calculateMedian = (values) => {
    const sortedValues = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sortedValues.length / 2);
    return sortedValues.length % 2 !== 0
      ? sortedValues[mid]
      : (sortedValues[mid - 1] + sortedValues[mid]) / 2;
};

const calculatePercentile = (arr: number[], percentile: number): number => {
    // Trier le tableau pour pouvoir calculer le percentile
    const sortedArr = arr.sort((a, b) => a - b);
    const index = Math.floor(percentile / 100 * (sortedArr.length - 1));
    return sortedArr[index];
};
  
const data_player_off = (playerData, selectedPlayersId) => {
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
        accurateLongBalls: roundToTwoDigits(100 * totalStats.accurateLongBalls / totalStats.totalLongBalls || 0),
        touches: roundToTwoDigits((totalStats.touches * 90) / minutesPlayed),
        wonContest: roundToTwoDigits(100 * totalStats.wonContest / totalStats.totalContest || 0),
        wasFouled: roundToTwoDigits((totalStats.wasFouled * 90) / minutesPlayed),
        possessionLostCtrl: roundToTwoDigits((totalStats.possessionLostCtrl * 90) / minutesPlayed),
        goalAssist: roundToTwoDigits((totalStats.goalAssist * 90) / minutesPlayed),
        minutesPlayed: totalStats.minutesPlayed,
      };
    };

    const secondPlayer = selectedPlayersId.length === 2;
    const selectedPlayerMetrics = calculateMetrics(playerData[selectedPlayersId[0].toString()]);
    const selectedPlayerPosition = secondPlayer ? 
      playerData[selectedPlayersId[0].toString()].player.position === playerData[selectedPlayersId[1].toString()].player.position ?
      [playerData[selectedPlayersId[0].toString()].player.position] :
      ["F", "M", "D"] : 
      [playerData[selectedPlayersId[0].toString()].player.position];
    const secondPlayerMetrics = secondPlayer ? calculateMetrics(playerData[selectedPlayersId[1].toString()]) : {};

    // Filtrer les joueurs ayant la même position et au moins 300 minutes jouées
    const playersWithSamePosition = Object.keys(playerData).filter(playerId => {
      const player = playerData[playerId];
      const metrics = calculateMetrics(player);
      return (
        selectedPlayerPosition.includes(player.player.position) &&
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

    // Fonction pour calculer le percentile
    const calculatePercentile = (arr: number[], value: number): number => {
      const sortedArr = arr.sort((a, b) => a - b);
      const index = sortedArr.findIndex(val => val >= value); // Trouve la position du joueur
      return (index / sortedArr.length) * 100; // Calcul du percentile
    };

    // Calculer les percentiles pour les joueurs A et B
    const percentileMetricsA = Object.keys(metricsByCategory).reduce((acc, key) => {
      acc[key] = calculatePercentile(metricsByCategory[key], selectedPlayerMetrics[key]);
      return acc;
    }, {});

    const percentileMetricsB = secondPlayer ? Object.keys(metricsByCategory).reduce((acc, key) => {
      acc[key] = calculatePercentile(metricsByCategory[key], secondPlayerMetrics[key]);
      return acc;
    }, {}) : {};  // Si pas de secondPlayer, on laisse vide

    const maxMetrics = Object.keys(metricsByCategory).reduce((acc, key) => {
      acc[key] = Math.max(...metricsByCategory[key]);
      return acc;
    }, {});

    // Construire la variable dataPlayerOff avec A et B
    const dataPlayerOff = Object.keys(selectedPlayerMetrics).map(key => {
      if (key === "minutesPlayed") return null; // Ignorer "minutesPlayed"
      return {
        subject: key,
        base: maxMetrics[key],
        width: 100,
        A: percentileMetricsA[key],  // Remplacer percentileA par A
        valA: selectedPlayerMetrics[key],
        B: secondPlayer ? percentileMetricsB[key] : "",  // Remplacer percentileB par B
        valB: secondPlayer ? secondPlayerMetrics[key] : "",
        description: description[key],
      };
    }).filter(item => item !== null); // Filtrer les null (minutesPlayed)

    return dataPlayerOff;
};


const data_player_def = (playerData, selectedPlayersId) => {
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
        accuratePass: roundToTwoDigits(100*totalStats.accuratePass / totalStats.totalPass || 0),
        duelWon: roundToTwoDigits(100*(totalStats.duelWon/(totalStats.duelWon+totalStats.duelLost)) || 0),
        aerialWon: roundToTwoDigits(100*(totalStats.aerialWon/(totalStats.aerialWon+totalStats.aerialLost)) || 0),
        fouls: roundToTwoDigits((totalStats.fouls * 90) / minutesPlayed),
        challengeLost: roundToTwoDigits((totalStats.challengeLost * 90) / minutesPlayed),
        totalTackle: roundToTwoDigits((totalStats.totalTackle * 90) / minutesPlayed),
        minutesPlayed: totalStats.minutesPlayed,
      };
    };

    const secondPlayer = selectedPlayersId.length === 2;
    const selectedPlayerMetrics = calculateMetrics(playerData[selectedPlayersId[0].toString()]);
    const selectedPlayerPosition = secondPlayer ? ["F", "M", "D"] : [playerData[selectedPlayersId[0].toString()].player.position];
    const secondPlayerMetrics = secondPlayer ? calculateMetrics(playerData[selectedPlayersId[1].toString()]) : {};

    // Filtrer les joueurs ayant la même position et au moins 300 minutes jouées
    const playersWithSamePosition = Object.keys(playerData).filter(playerId => {
      const player = playerData[playerId];
      const metrics = calculateMetrics(player);
      return (
          selectedPlayerPosition.includes(player.player.position) &&
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

    // Fonction pour calculer le percentile
    const calculatePercentile = (arr: number[], value: number): number => {
      const sortedArr = arr.sort((a, b) => a - b);
      const index = sortedArr.findIndex(val => val >= value); // Trouve la position du joueur
      return (index / sortedArr.length) * 100; // Calcul du percentile
    };

    // Calculer les percentiles pour les joueurs A et B
    const percentileMetricsA = Object.keys(metricsByCategory).reduce((acc, key) => {
      acc[key] = calculatePercentile(metricsByCategory[key], selectedPlayerMetrics[key]);
      return acc;
    }, {});

    const percentileMetricsB = secondPlayer ? Object.keys(metricsByCategory).reduce((acc, key) => {
      acc[key] = calculatePercentile(metricsByCategory[key], secondPlayerMetrics[key]);
      return acc;
    }, {}) : {};  // Si pas de secondPlayer, on laisse vide

    const maxMetrics = Object.keys(metricsByCategory).reduce((acc, key) => {
      acc[key] = Math.max(...metricsByCategory[key]);
      return acc;
    }, {});

    // Construire la variable dataPlayerDef avec A et B
    const dataPlayerDef = Object.keys(selectedPlayerMetrics).map(key => {
      if (key === "minutesPlayed") return null; // Ignorer "minutesPlayed"
      return {
        subject: key,
        base: maxMetrics[key],
        width: 100,
        A: percentileMetricsA[key],  // Remplacer percentileA par A
        valA: selectedPlayerMetrics[key],
        B: secondPlayer ? percentileMetricsB[key] : "",  // Remplacer percentileB par B
        valB: secondPlayer ? secondPlayerMetrics[key] : "",
        description: description[key],
      };
    }).filter(item => item !== null); // Filtrer les null (minutesPlayed)

    return dataPlayerDef;
};


const voidChart = [
    {nothing: 100, fill:"#eee"},
    {nothing: 100, fill:"#eee"},
    {nothing: 100, fill:"#eee"},
    {nothing: 100, fill:"#eee"},
    {nothing: 100, fill:"#eee"},
    {nothing: 100, fill:"#eee"},
    {nothing: 100, fill:"#eee"},
    {nothing: 100, fill:"#eee"},
];

export default function RankPercent({ playerData, selectedPlayersId, type }) {
  const secondPlayer = selectedPlayersId.length === 2 ? true : false;
  const data = type === 'off' ? data_player_off(playerData, selectedPlayersId) : data_player_def(playerData, selectedPlayersId);

  return (
    <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
            <CardTitle>{type === 'off' ? 'Statistiques offensives' : 'Statistiques défensives'}</CardTitle>
            <CardDescription>Classement par percentile</CardDescription>
        </CardHeader>
        <CardContent className="flex pb-0">
            <ChartContainer
                config={chartConfig}
                className="mx-auto h-[500px]"
            >
                <PieChart>
                    <Pie
                        data={voidChart}
                        dataKey="nothing"
                        nameKey=""
                        innerRadius={60}
                        strokeWidth={5}
                        outerRadius={200}
                        paddingAngle={0}
                    />
                    <Pie
                        data={data}
                        dataKey="width"
                        nameKey="subject"
                        innerRadius={60}
                        strokeWidth={5}
                        paddingAngle={3}
                        activeIndex={[0, 1, 2, 3, 4, 5, 6, 7]}
                        labelLine={false}
                        label={({ payload, ...props }) => {
                            return (
                            <text
                                cx={props.cx}
                                cy={props.cy}
                                x={props.x}
                                y={props.y}
                                textAnchor={props.textAnchor}
                                dominantBaseline={props.dominantBaseline}
                            >                  
                                <tspan x={props.x} dy="0em" className="font-sans font-light text-lg">{payload.description}</tspan>
                                <tspan x={props.x} dy="1.2em" className="font-sans font-extralight text-sm">{payload.valA}</tspan>
                            </text>
                            )
                        }}
                        activeShape={({
                            payload,
                            ...props
                        }: PieSectorDataItem) => (
                            <Sector {...props} outerRadius={60+140*(payload.A/100)}/>
                        )}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getStepColor(entry.A)} />
                        ))}
                        <LabelList
                            dataKey="A"
                            className="fill-background"
                            stroke="none"
                            fontSize={15}
                            content={({ ...props }) => {
                                console.log(props);
                                const L = 30;
                                const radius = 200*(props.value/100);
                                const text_x = props.cx+Math.cos(Math.PI*(props.viewBox.startAngle+(props.viewBox.endAngle-props.viewBox.startAngle)/2)/180)*(props.viewBox.outerRadius-props.viewBox.innerRadius);
                                const square_x = props.cx+Math.cos(Math.PI*(props.viewBox.startAngle+(props.viewBox.endAngle-props.viewBox.startAngle)/2)/180)*(props.viewBox.outerRadius-props.viewBox.innerRadius)-L/2;
                                const text_y = props.cy-Math.sin(Math.PI*(props.viewBox.startAngle+(props.viewBox.endAngle-props.viewBox.startAngle)/2)/180)*(props.viewBox.outerRadius-props.viewBox.innerRadius);
                                const square_y = props.cy-Math.sin(Math.PI*(props.viewBox.startAngle+(props.viewBox.endAngle-props.viewBox.startAngle)/2)/180)*(props.viewBox.outerRadius-props.viewBox.innerRadius)-L/2;

                                return (
                                <g>
                                    <g>
                                        <rect
                                            x={square_x} 
                                            y={square_y} 
                                            width={L}
                                            height={L}
                                            fill="#c9c5b1"
                                            rx={4} 
                                        />
                                        <text
                                            x={text_x} 
                                            y={text_y} 
                                            
                                            fill="#fff"
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            className="font-sans font-light text-sm"
                                        >
                                            {Math.round(props.value)}
                                        </text>
                                    </g>
                                </g>
                            )}}
                        />
                    </Pie>
                    
                </PieChart>
            </ChartContainer>

            {secondPlayer && 
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto h-[500px]"
                >
                    <PieChart>
                        <Pie
                            data={voidChart}
                            dataKey="nothing"
                            nameKey=""
                            innerRadius={60}
                            strokeWidth={5}
                            outerRadius={200}
                            paddingAngle={0}
                        />
                        <Pie
                            data={data}
                            dataKey="width"
                            nameKey="subject"
                            innerRadius={60}
                            strokeWidth={5}
                            paddingAngle={3}
                            activeIndex={[0, 1, 2, 3, 4, 5, 6, 7]}
                            labelLine={false}
                            label={({ payload, ...props }) => {
                                return (
                                <text
                                    cx={props.cx}
                                    cy={props.cy}
                                    x={props.x}
                                    y={props.y}
                                    textAnchor={props.textAnchor}
                                    dominantBaseline={props.dominantBaseline}
                                >                  
                                    <tspan x={props.x} dy="0em" className="font-sans font-light text-lg">{payload.description}</tspan>
                                    <tspan x={props.x} dy="1.2em" className="font-sans font-extralight text-sm">{payload.valB}</tspan>
                                </text>
                                )
                            }}
                            activeShape={({
                                payload,
                                ...props
                            }: PieSectorDataItem) => (
                                <Sector {...props} outerRadius={60+140*(payload.B/100)}/>
                            )}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getStepColor(entry.B)} />
                            ))}
                            <LabelList
                                dataKey="B"
                                className="fill-background"
                                stroke="none"
                                fontSize={15}
                                content={({ ...props }) => {
                                    const L = 30;
                                    const text_x = props.cx+Math.cos(Math.PI*(props.viewBox.startAngle+(props.viewBox.endAngle-props.viewBox.startAngle)/2)/180)*(props.viewBox.outerRadius-props.viewBox.innerRadius);
                                    const square_x = props.cx+Math.cos(Math.PI*(props.viewBox.startAngle+(props.viewBox.endAngle-props.viewBox.startAngle)/2)/180)*(props.viewBox.outerRadius-props.viewBox.innerRadius)-L/2;
                                    const text_y = props.cy-Math.sin(Math.PI*(props.viewBox.startAngle+(props.viewBox.endAngle-props.viewBox.startAngle)/2)/180)*(props.viewBox.outerRadius-props.viewBox.innerRadius);
                                    const square_y = props.cy-Math.sin(Math.PI*(props.viewBox.startAngle+(props.viewBox.endAngle-props.viewBox.startAngle)/2)/180)*(props.viewBox.outerRadius-props.viewBox.innerRadius)-L/2;

                                    return (
                                    <g>
                                        <g>
                                            <rect
                                                x={square_x} 
                                                y={square_y} 
                                                width={L}
                                                height={L}
                                                fill="#c9c5b1"
                                                rx={4} 
                                            />
                                            <text
                                                x={text_x} 
                                                y={text_y} 
                                                
                                                fill="#fff"
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                className="font-sans font-light text-sm"
                                            >
                                                {Math.round(props.value)}
                                            </text>
                                        </g>
                                    </g>
                                )}}
                            />
                        </Pie>
                        
                    </PieChart>
                </ChartContainer>
            }
        </CardContent>
        {/*<CardFooter className="flex-col gap-2 text-sm">
            <div className="leading-none text-muted-foreground">
            Data per 90min
            </div>
        </CardFooter>*/}
    </Card>
  )
}
