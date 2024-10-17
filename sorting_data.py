import json

# Charger les données du fichier JSON
with open('./all_season.json', 'r', encoding='utf-8') as file:
    data = json.load(file)

# Initialisation des structures de données pour les clubs
clubs = {}
# Parcourir les matchs et agréger les données pour chaque club
for game in data['games']:
    for team in ['home', 'away']:
        team_name = game[f"{team}_team"]['namecode']
        clubs[team_name] = {'games':[]}

for game in data['games']:
    for team in ['home', 'away']:
        team_name = game[f"{team}_team"]['namecode']
        team_game = {}
        team_game['isHome'] = team
        team_game['score'] = game['score']
        if 'statistics' in game:
            for stats_group in game['statistics']:
                team_game[stats_group] = {}
                for stat in game['statistics'][stats_group]:
                    team_game[stats_group][stat] = {
                        'value': game['statistics'][stats_group][stat][team],
                        'type': game['statistics'][stats_group][stat]['type']
                    }
        clubs[team_name]['games'].append(team_game)

# Sauvegarder les résultats dans un fichier JSON
with open('./clubs.json', 'w', encoding='utf-8') as club_file:
    json.dump(clubs, club_file, indent=4)

print("Done!")
