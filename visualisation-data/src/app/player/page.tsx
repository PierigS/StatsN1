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
        statistics: Record<string, any>;
    }>;
    teamId: number;
}

interface ClubInfo {
    name: string;
    teamId: number;
}

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
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Players;
