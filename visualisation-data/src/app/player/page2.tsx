// src/app/Players.tsx

'use client';

import React, { useState, useEffect } from 'react';
import SelectCustom from '@/components/select-custom';

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
        }
        marketValueCurrency: string;
        dateOfBirthTimestamp: string;
        proposedMarketValueRaw: {
            value: number;
            currency: string;
        }
    };
    games: Array<{
        match: number;
        statistics: Record<string, any>;
    }>;
    teamId: number;
}

function Players() {
    const [data, setData] = useState<Record<string, PlayerInfo> | null>(null);
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        // Charger les données des joueurs
        fetch('/players.json')
            .then((response) => response.json())
            .then((data: Record<string, PlayerInfo>) => {
                setData(data);
            })
            .catch((error) => console.error('Erreur lors du chargement des données :', error));
    }, []);

    // Récupérer la liste des équipes uniques à partir des données
    const teams = data
        ? Array.from(new Set(Object.values(data).map((player) => player.teamId)))
        : [];

    // Création d'une liste de noms de joueurs pour l'équipe sélectionnée
    const playerOptions = selectedTeam && data
        ? Object.entries(data)
              .filter(([_, playerData]) => playerData.teamId === selectedTeam)
              .map(([id, playerData]) => ({ id, name: playerData.player.name }))
        : [];

    // Récupérer le nom des joueurs pour l'afficher dans SelectCustom
    const playerNames = playerOptions.map((player) => player.name);

    // Fonction pour récupérer le slug du joueur sélectionné
    const handlePlayerSelect = (name: string) => {
        const player = playerOptions.find((player) => player.name === name);
        setSelectedPlayer(player ? player.id : null);
        setImageError(false); // Réinitialiser l'erreur d'image à chaque sélection de joueur
    };

    // Récupération des données du joueur sélectionné
    const playerData = selectedPlayer && data ? data[selectedPlayer] : null;

    const calculatePlayerStats = (player: PlayerInfo) => {
        console.log(player);
        const stats = player.games.reduce(
            (acc, game) => {
                acc.minutesPlayed += game.statistics.minutesPlayed || 0;
                acc.goals += game.statistics.goals || 0;
                acc.assists += game.statistics.goalAssist || 0;
                if (game.statistics.substitute === false) acc.starts += 1;
                return acc;
            },
            { minutesPlayed: 0, starts: 0, goals: 0, assists: 0 }
        );

        return stats;
    };
    const stats = playerData !== null ? calculatePlayerStats(playerData) : null;

    return (
        <div>
            <SelectCustom
                options={teams}
                placeholder="Sélectionnez une équipe"
                onSelect={(value) => {
                    setSelectedTeam(value);
                    setSelectedPlayer(null); // Réinitialiser le joueur sélectionné lors du changement d'équipe
                }}
            />
            {selectedTeam && (
                <SelectCustom
                    options={playerNames}
                    placeholder="Sélectionnez un joueur"
                    onSelect={handlePlayerSelect}
                />
            )}
            {playerData && (
                <div>
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
                                    src={`/players_faces/${playerData.player.id}.png`}
                                    alt={`Portrait de ${playerData.player.name}`}
                                    onError={() => setImageError(true)}
                                    style={{ width: '100px', height: '100px', borderRadius: '50%' }}
                                />
                            )}
                        </div>
                        

                        <div>
                            <p className='text-2xl'>{playerData.player.name}</p>
                            <p className='text-xl'>{playerData.teamId}</p>
                            <p className='text-l'>{playerData.player.country.name}</p>
                            <p className='text-left'>Position : {playerData.player.position}</p>
                            <p className='text-left'>Numéro de maillot : {playerData.player.jerseyNumber}</p>
                            <p>{stats?.minutesPlayed}min jouées. {stats?.starts} titularisations. {stats?.goals} buts. {stats?.assists} passes décisives.</p>
                        </div>
                    </div>
                    <div>
                        erijgnlirehgilr
                    </div>
                </div>
                
            )}
        </div>
    );
}

export default Players;
