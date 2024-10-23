import json

# Charger les données du fichier JSON
with open('./visualisation-data/public/all_season.json', 'r', encoding='utf-8') as file:
    data = json.load(file)

# Initialisation des structures de données pour les clubs
clubs = {}

# Parcourir les matchs et agréger les données pour chaque club
for game in data['games']:
    for team in ['home', 'away']:
        team_name = game[f"{team}_team"]['namecode']
        if team_name not in clubs:
            clubs[team_name] = {'games': [], 'means': {}}
            clubs[team_name]['name'] = game[f"{team}_team"]['name']

for game in data['games']:
    for team in ['home', 'away']:
        team_name = game[f"{team}_team"]['namecode']
        team_game = {}
        team_game['isHome'] = team
        team_game['score'] = game['score']
        team_game['stats'] = {}
        
        if 'statistics' in game:
            for stats_group in game['statistics']:
                # Initialiser le groupe de statistiques s'il n'existe pas encore
                if stats_group not in team_game['stats']:
                    team_game['stats'][stats_group] = {}
                
                for stat in game['statistics'][stats_group]:
                    value = game['statistics'][stats_group][stat][team]
                    team_game['stats'][stats_group][stat] = {
                        'value': value,
                        'type': game['statistics'][stats_group][stat]['type']
                    }

                    # Accumuler pour les moyennes
                    if stats_group not in clubs[team_name]['means']:
                        clubs[team_name]['means'][stats_group] = {}

                    if stat not in clubs[team_name]['means'][stats_group]:
                        clubs[team_name]['means'][stats_group][stat] = {
                            'total': 0, 
                            'count': 0,
                        }

                    clubs[team_name]['means'][stats_group][stat]['total'] += value
                    clubs[team_name]['means'][stats_group][stat]['count'] += 1

        clubs[team_name]['games'].append(team_game)

# Calculer les moyennes pour chaque statistique
for club in clubs:
    for stats_group in clubs[club]['means']:
        for stat in clubs[club]['means'][stats_group]:
            count = clubs[club]['means'][stats_group][stat]['count']
            total = clubs[club]['means'][stats_group][stat]['total']
            if count > 0:
                clubs[club]['means'][stats_group][stat]['mean'] = int(100*total / count)/100
            else:
                clubs[club]['means'][stats_group][stat]['mean'] = 0 

# Sauvegarder les résultats dans un fichier JSON
with open('./visualisation-data/public/clubs.json', 'w', encoding='utf-8') as club_file:
    json.dump(clubs, club_file, indent=4)

print("Done!")
