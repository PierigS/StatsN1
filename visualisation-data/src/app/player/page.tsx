// src/app/Players.tsx

'use client';

import React, { useState, useEffect } from 'react';
import SelectCustom from '@/components/select-custom';

interface PlayerInfo {
    infos: {
        team: string;
        name: string;
        id: number;
        position: string;
        jerseyNumber: string;
    };
    games: Array<{
        match: number;
        statistics: Record<string, any>;
    }>;
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
        ? Array.from(new Set(Object.values(data).map((player) => player.infos.team)))
        : [];

    // Création d'une liste de noms de joueurs pour l'équipe sélectionnée
    const playerOptions = selectedTeam && data
        ? Object.entries(data)
              .filter(([_, playerData]) => playerData.infos.team === selectedTeam)
              .map(([slug, playerData]) => ({ slug, name: playerData.infos.name }))
        : [];

    // Récupérer le nom des joueurs pour l'afficher dans SelectCustom
    const playerNames = playerOptions.map((player) => player.name);

    // Fonction pour récupérer le slug du joueur sélectionné
    const handlePlayerSelect = (name: string) => {
        const player = playerOptions.find((player) => player.name === name);
        setSelectedPlayer(player ? player.slug : null);
        setImageError(false); // Réinitialiser l'erreur d'image à chaque sélection de joueur
    };

    // Récupération des données du joueur sélectionné
    const playerData = selectedPlayer && data ? data[selectedPlayer] : null;

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
                    <h3>Données pour le joueur : {playerData.infos.name}</h3>
                    <p>Équipe : {playerData.infos.team}</p>
                    <p>Position : {playerData.infos.position}</p>
                    <p>Numéro de maillot : {playerData.infos.jerseyNumber}</p>
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
                            src={`/players_faces/${playerData.infos.id}.png`}
                            alt={`Portrait de ${playerData.infos.name}`}
                            onError={() => setImageError(true)}
                            style={{ width: '100px', height: '100px', borderRadius: '50%' }}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

export default Players;
