import json
import requests
import os

def call_api(url):
    return requests.get(url).json()

# Charger le dictionnaire stat_against depuis le fichier JSON
with open('./visualisation-data/public/stats_against.json', 'r', encoding='utf-8') as file:
    stat_against = json.load(file)

# Charger les données du fichier JSON des matchs
with open('./visualisation-data/public/all_season.json', 'r', encoding='utf-8') as file:
    data = json.load(file)

# Initialisation des structures de données pour les clubs
clubs = {}
players = {}

# Parcourir les matchs et agréger les données pour chaque club
for game in data['games']:
    for team in ['home', 'away']:
        team_name = game[f"{team}_team"]['namecode']
        if team_name not in clubs:
            clubs[team_name] = {'games': [], 'means': {'overview':{'goalsScored':{'total':0, 'count':0}, 'goalsAgainst': {'total':0, 'count':0}}}}
            clubs[team_name]['name'] = game[f"{team}_team"]['name']

for game in data['games']:
    for team, opponent in [('home', 'away'), ('away', 'home')]:
        if game['score'] != 'postponed':
            team_name = game[f"{team}_team"]['namecode']
            opponent_name = game[f"{opponent}_team"]['namecode']
            
            team_game = {
                'isHome': team,
                'score': game['score'],
                'stats': {},
            }
            # Ajouter les buts marqués et encaissés
            if team == 'home':
                goals_scored = game['score']['home']
                goals_against = game['score']['away']
            else:
                goals_scored = game['score']['away']
                goals_against = game['score']['home']
            
            clubs[team_name]['means']['overview']['goalsScored']['total'] += goals_scored
            clubs[team_name]['means']['overview']['goalsScored']['count'] += 1
            clubs[team_name]['means']['overview']['goalsAgainst']['total'] += goals_against
            clubs[team_name]['means']['overview']['goalsAgainst']['count'] += 1

            if 'statistics' in game:
                for stats_group in game['statistics']:
                    # Initialiser le groupe de statistiques s'il n'existe pas encore
                    if stats_group not in team_game['stats']:
                        team_game['stats'][stats_group] = {}
                    
                    for stat, stat_data in game['statistics'][stats_group].items():
                        value = stat_data[team]
                        team_game['stats'][stats_group][stat] = {
                            'value': value,
                            'type': stat_data['type']
                        }

                        # Ajouter la statistique au total pour les moyennes
                        if stats_group not in clubs[team_name]['means']:
                            clubs[team_name]['means'][stats_group] = {}

                        if stat not in clubs[team_name]['means'][stats_group]:
                            clubs[team_name]['means'][stats_group][stat] = {
                                'total': 0, 
                                'count': 0,
                            }
                        clubs[team_name]['means'][stats_group][stat]['total'] += value
                        clubs[team_name]['means'][stats_group][stat]['count'] += 1

                        # Ajouter les statistiques subies selon `stat_against`
                        if stats_group in stat_against and stat in stat_against[stats_group]:
                            new_name = stat_against[stats_group][stat]['new_name']
                            new_group = stat_against[stats_group][stat]['new_group']
                            opponent_value = stat_data[opponent]
                            
                            if new_group not in team_game['stats']:
                                team_game['stats'][new_group] = {}
                            
                            team_game['stats'][new_group][new_name] = {
                                'value': opponent_value,
                                'type': stat_data['type']
                            }

                            # Ajouter les statistiques subies aux moyennes
                            if new_group not in clubs[team_name]['means']:
                                clubs[team_name]['means'][new_group] = {}

                            if new_name not in clubs[team_name]['means'][new_group]:
                                clubs[team_name]['means'][new_group][new_name] = {
                                    'total': 0, 
                                    'count': 0,
                                }
                            clubs[team_name]['means'][new_group][new_name]['total'] += opponent_value
                            clubs[team_name]['means'][new_group][new_name]['count'] += 1

            clubs[team_name]['games'].append(team_game)
            
            # Ajouter les informations de chaque joueur dans `players`
            if 'players_stats' in game:
                for player_info in game['players_stats'][team]:
                    player_slug = player_info
                    if player_slug not in players:
                        players[player_slug] = {'games': []}
                        
                    if 'infos' not in players[player_slug]:
                        data_player = call_api(f'https://www.sofascore.com/api/v1/player/{game['players_stats'][team][player_info]['id']}')['player']
                        players[player_slug]['infos'] = {
                            'id': data_player['id'],
                            'name': data_player['name'],
                            'country': data_player['country']
                        }
                    if 'team' in data_player:
                        players[player_slug]['infos']['team'] = data_player['team']
                    if 'jerseyNumber' in data_player:
                        players[player_slug]['infos']['jerseyNumber'] = data_player['jerseyNumber']
                    if 'height' in data_player:
                        players[player_slug]['infos']['height'] = data_player['height']
                    if 'preferredFoot' in data_player:
                        players[player_slug]['infos']['preferredFoot'] = data_player['preferredFoot']
                    if 'contractUntilTimestamp' in data_player:
                        players[player_slug]['infos']['contractUntilTimestamp'] = data_player['contractUntilTimestamp']
                    if 'dateOfBirthTimestamp' in data_player:
                        players[player_slug]['infos']['dateOfBirthTimestamp'] = data_player['dateOfBirthTimestamp']
                    if 'proposedMarketValue' in data_player:
                        players[player_slug]['infos']['proposedMarketValue'] = f'{data_player['proposedMarketValue']}€'
                            
                    if not os.path.isfile(f'./visualisation-data/public/players_faces/{players[player_slug]["infos"]["id"]}.png'):
                        response = requests.get(f'https://www.sofascore.com/api/v1/player/{game["players_stats"][team][player_info]["id"]}/image')

                        if response.status_code == 200:
                            with open(f'./visualisation-data/public/players_faces/{players[player_slug]["infos"]["id"]}.png', 'wb') as file:
                                file.write(response.content)
                        
                    player_game_data = {
                        'team': clubs[team_name]['name'],
                        'team-short': team_name,
                        'match': game['round'],
                        'position': game['players_stats'][team][player_info].get('position', ''),
                        'statistics': game['players_stats'][team][player_info].get('statistics', {}),
                    }
                    
                    players[player_slug]['games'].append(player_game_data)

# Calculer les moyennes pour chaque statistique
for club in clubs:
    for stats_group in clubs[club]['means']:
        for stat in clubs[club]['means'][stats_group]:
            count = clubs[club]['means'][stats_group][stat]['count']
            total = clubs[club]['means'][stats_group][stat]['total']
            clubs[club]['means'][stats_group][stat]['mean'] = int(100 * total / count) / 100 if count > 0 else 0 

# Sauvegarder les résultats dans un fichier JSON
with open('./visualisation-data/public/clubs.json', 'w', encoding='utf-8') as club_file:
    json.dump(clubs, club_file, indent=4)

# Sauvegarder les résultats dans un fichier JSON pour les joueurs
with open('./visualisation-data/public/players.json', 'w', encoding='utf-8') as player_file:
    json.dump(players, player_file, indent=4)


print("Done!")
