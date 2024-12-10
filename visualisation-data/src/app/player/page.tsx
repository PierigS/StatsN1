// src/app/Players.tsx

'use client';

import React, { useState, useEffect } from 'react';
import SelectCustom from '@/components/select-custom';
import RadarOff from '@/components/radar-off';
import RadarDef from '@/components/radar-def';

interface PlayerInfo {
    player: {
        name: string;
        slug: string;
        shortName: string;
        position: string;
        jerseyNumber: string;
        height: string;
        userCount: string;
        id: number;
        country: {
            alpha2: string;
            alpha3: string;
            name: string;
            slug: string;
        };
        marketValueCurrency: string;
        dateOfBirthTimestamp: string;
        proposedMarketValueRaw: {
            value: number;
            currency: string;
        };
    };
    games: Array<{
        match: number;
        substitute?: boolean;
        statistics: {
            totalPass: number | null;
            accuratePass: number | null;
            totalLongBalls: number | null;
            accurateLongBalls: number | null;
            goalAssist: number | null;
            totalCross: number | null;
            accurateCross: number | null;
            aerialLost: number | null;
            aerialWon: number | null;
            duelLost: number | null;
            duelWon: number | null;
            challengeLost: number | null;
            dispossessed: number | null;
            totalContest: number | null;
            wonContest: number | null;
            onTargetScoringAttempt: number | null;
            goals: number | null;
            totalClearance: number | null;
            outfielderBlock: number | null;
            interceptionWon: number | null;
            totalTackle: number | null;
            errorLeadToAShot: number | null;
            ownGoals: number | null;
            wasFouled: number | null;
            fouls: number | null;
            totalOffside: number | null;
            minutesPlayed: number | null;
            touches: number | null;
            rating: number | null;
            possessionLostCtrl: number | null;
            expectedGoals: number | null;
            keyPass: number | null;
            ratingVersions: {
                original: number | null;
                alternative: number | null;
            };
            expectedAssists: number | null;
        };
    }>;
    teamId: number;
}

interface ClubInfo {
    name: string;
    teamId: number;
}

const calculatePlayerStats = (player: PlayerInfo) => {
    const stats = player.games.reduce(
        (acc, game) => {
            acc.minutesPlayed += game.statistics.minutesPlayed || 0;
            acc.goals += game.statistics.goals || 0;
            acc.assists += game.statistics.goalAssist || 0;
            if (game.substitute === false) acc.starts += 1;
            return acc;
        },
        { minutesPlayed: 0, starts: 0, goals: 0, assists: 0 }
    );

    return stats;
};


function Players() {
    const [playerData, setPlayerData] = useState<Record<string, PlayerInfo> | null>(null);
    const [clubData, setClubData] = useState<ClubInfo[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        // Charger les données des joueurs
        fetch('/players.json')
            .then((response) => response.json())
            .then((data: Record<string, PlayerInfo>) => setPlayerData(data))
            .catch((error) => console.error('Erreur lors du chargement des données des joueurs :', error));

        // Charger les données des clubs
        fetch('/clubs.json')
            .then((response) => response.json())
            .then((data: Record<string, ClubInfo>) => setClubData(Object.values(data)))
            .catch((error) => console.error('Erreur lors du chargement des données des clubs :', error));
    }, []);

    // Filtrer les joueurs de l'équipe sélectionnée
    const playerOptions = selectedTeam && playerData
        ? Object.values(playerData)
              .filter((player) => player.teamId === selectedTeam)
              .map((player) => ({ value: player.player.id, label: player.player.name }))
        : [];

    // Récupérer les données du joueur sélectionné
    const selectedPlayerData = selectedPlayer && playerData
        ? Object.values(playerData).find((player) => player.player.id === selectedPlayer)
        : null;

    // Récupérer le nom de l'équipe correspondant à l'ID de l'équipe du joueur sélectionné
    const teamName = selectedPlayerData && clubData.length > 0
        ? clubData.find((club) => club.teamId === selectedPlayerData.teamId)?.name
        : '';
    
    const playerStats = selectedPlayerData ? calculatePlayerStats(selectedPlayerData) : null;

    return (
        <div>
            {/* Sélecteur pour choisir une équipe */}
            <SelectCustom
                options={clubData.map((club) => ({ value: club.teamId, label: club.name }))}
                placeholder="Sélectionnez une équipe"
                onSelect={(value) => {
                    setSelectedTeam(Number(value));
                    setSelectedPlayer(null); // Réinitialiser le joueur sélectionné lors du changement d'équipe
                }}
            />

            {/* Sélecteur pour choisir un joueur, visible seulement lorsqu'une équipe est sélectionnée */}
            {selectedTeam && (
                <SelectCustom
                    options={playerOptions}
                    placeholder="Sélectionnez un joueur"
                    onSelect={(value) => setSelectedPlayer(Number(value))}
                />
            )}

            {/* Affichage des informations du joueur sélectionné */}
            {selectedPlayerData && (
                <div className='w-full'>
                    <div className='flex flex-column p-5'>
                    <div className='w-[150px]'>
                            {imageError ? (
                                <div style={{
                                    width: '100px',
                                    height: '100px',
                                    backgroundColor: '#e0e0e0',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.8em',
                                    color: '#888',
                                }}>
                                    Image indisponible
                                </div>
                            ) : (
                                <img
                                    src={`/players_faces/${selectedPlayerData.player.id}.png`}
                                    alt={`Portrait de ${selectedPlayerData.player.name}`}
                                    onError={() => setImageError(true)}
                                    style={{ width: '100px', height: '100px', borderRadius: '50%' }}
                                />
                            )}
                        </div>
                        <div className="mt-4">
                            <p className="text-2xl">{selectedPlayerData.player.name}</p>
                            <p className="text-xl">{teamName}</p>
                            <p className="text-l">{selectedPlayerData.player.country.name}</p>
                            <p className="text-left">Position : {selectedPlayerData.player.position}</p>
                            <p className="text-left">Numéro de maillot : {selectedPlayerData.player.jerseyNumber}</p>
                            {playerStats && (
                                <p>{playerStats.minutesPlayed}min jouées. {playerStats.starts} titularisations. {playerStats.goals} buts. {playerStats.assists} passes décisives.</p>
                            )}
                        </div>
                    </div>
                    {/*<RadarPlayer playerData={playerData} selectedPlayerId={selectedPlayer} />*/}
                    {playerStats?.minutesPlayed > 300 && (
                        <div className='flex w-full'>
                            <div className='flex-1 w-[850px]'>
                                <RadarOff playerData={playerData} selectedPlayerId={selectedPlayer} />
                            </div>
                            <div className='flex-1 w-[850px]'>
                                <RadarDef playerData={playerData} selectedPlayerId={selectedPlayer} />
                            </div>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}

export default Players;
