from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium_stealth import stealth
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException, TimeoutException

import requests
import json
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

missing_stats = []
all_games = {}
matchdays = []

def which_selected_match_day(driver):
    return int(driver.find_element(By.XPATH, '//*[@id="__next"]/main/div/div[3]/div/div[1]/div[1]/div[5]/div/div[3]/div/div/div[1]/div/div[1]/div/button/div/div').text.split(' ')[1])

def call_api(url):
    return requests.get(url).json()

def write_json(file_path, data):
    with open(file_path, 'w', encoding='utf-8') as json_file:
        json.dump(data, json_file, ensure_ascii=False, indent=4)

def get_game_ids():
    chrome_options = Options()
    chrome_options.add_experimental_option("detach", True)
    chrome_options.add_argument("--start-maximized")

    driver = webdriver.Chrome(options=chrome_options)
    stealth(driver,
            user_agent='random',
            languages=["fr-FR", "fr"],
            vendor="Google Inc.",
            platform="Win64",
            webgl_vendor="Intel Inc.",
            renderer="Intel Iris OpenGL Engine",
            fix_hairline=True)

    driver.get('https://www.sofascore.com/fr/tournoi/football/france/national-1/183#id:64124')

    time.sleep(2)
    driver.find_element(By.CLASS_NAME, 'fc-button').click()
    game_ids = []
    while which_selected_match_day(driver) > 1:
        matchday_number = which_selected_match_day(driver)
        #change la journée sur la dernière jouée
        driver.find_element(By.XPATH, '//*[@id="__next"]/main/div/div[3]/div/div[1]/div[1]/div[5]/div/div[3]/div/div/div[1]/div/div[1]/button[1]').click()

        time.sleep(0.5)

        all_links = driver.find_elements(By.XPATH, '//*[@id="__next"]/main/div/div[3]/div/div[1]/div[1]/div[5]/div/div[3]/div/div/div[1]/div/div[2]//a')
        game_ids.extend([link.get_attribute('href').split('#')[1].split(':')[1] for link in all_links if 'match' in link.get_attribute('href')])

    driver.close()
    return game_ids

def get_game(game, game_id):
    teams_infos = call_api(f"{api_links['game']}{game_id}")
    game['round'] = teams_infos['event']['roundInfo']['round']
    game['home_team'] = {
        'name': teams_infos['event']['homeTeam']['name'],
        'namecode': teams_infos['event']['homeTeam']['nameCode'],
    }
    game['away_team'] = {
        'name': teams_infos['event']['awayTeam']['name'],
        'namecode': teams_infos['event']['awayTeam']['nameCode'],
    }
    if teams_infos['event']['status']['code'] == 60:
        game['score'] = 'postponed'
        return game
    game['score'] = {
        'home': teams_infos['event']['homeScore']['current'],
        'away': teams_infos['event']['awayScore']['current'],
    }
    return game

def get_teams_stats(game, game_id):
    teams_stats = call_api(f"{api_links['game']}{game_id}{api_links['teams_stats']}")
    if 'error' in teams_stats:
        return game

    game['statistics'] = {}
    game['statistics']['overview'] = {}
    game['statistics']['shots'] = {}
    game['statistics']['attack'] = {}
    game['statistics']['passes'] = {}
    game['statistics']['duels'] = {}
    game['statistics']['defense'] = {}
    game['statistics']['goalkeepers'] = {}

    for stat in teams_stats['statistics'][0]['groups'][0]['statisticsItems']:
        game['statistics']['overview'][stat['key']] = {
            'home': stat['homeValue'],
            'away': stat['awayValue'],
            'type': stat['statisticsType'],
        }
    for stat in teams_stats['statistics'][0]['groups'][1]['statisticsItems']:
        game['statistics']['shots'][stat['key']] = {
            'home': stat['homeValue'],
            'away': stat['awayValue'],
            'type': stat['statisticsType'],
        }
    for stat in teams_stats['statistics'][0]['groups'][2]['statisticsItems']:
        game['statistics']['attack'][stat['key']] = {
            'home': stat['homeValue'],
            'away': stat['awayValue'],
            'type': stat['statisticsType'],
        }
    for stat in teams_stats['statistics'][0]['groups'][3]['statisticsItems']:
        game['statistics']['passes'][stat['key']] = {
            'home': stat['homeValue'],
            'away': stat['awayValue'],
            'type': stat['statisticsType'],
        }
    for stat in teams_stats['statistics'][0]['groups'][4]['statisticsItems']:
        game['statistics']['duels'][stat['key']] = {
            'home': stat['homeValue'],
            'away': stat['awayValue'],
            'type': stat['statisticsType'],
        }
    for stat in teams_stats['statistics'][0]['groups'][5]['statisticsItems']:
        game['statistics']['defense'][stat['key']] = {
            'home': stat['homeValue'],
            'away': stat['awayValue'],
            'type': stat['statisticsType'],
        }
    for stat in teams_stats['statistics'][0]['groups'][6]['statisticsItems']:
        game['statistics']['goalkeepers'][stat['key']] = {
            'home': stat['homeValue'],
            'away': stat['awayValue'],
            'type': stat['statisticsType'],
        }
    return game

def get_players_stats(game, game_id):
    players_stats = call_api(f"{api_links['game']}{game_id}{api_links['players_stats']}")
    if 'error' in players_stats:
        return game
    
    game['players_stats'] = {}
    game['players_stats']['home'] = {}
    game['players_stats']['away'] = {}
    for player in players_stats['home']['players']:
        if 'statistics' in player and 'position' in player:
            game['players_stats']['home'][player['player']['slug']] = {}
            game['players_stats']['home'][player['player']['slug']]['position'] = player['position']
            game['players_stats']['home'][player['player']['slug']]['statistics'] = player['statistics']
    for player in players_stats['away']['players']:
        if 'statistics' in player and 'position' in player:
            game['players_stats']['away'][player['player']['slug']] = {}
            game['players_stats']['away'][player['player']['slug']]['position'] = player['position']
            game['players_stats']['away'][player['player']['slug']]['statistics'] = player['statistics']
    return game

def get_game_events(game, game_id):
    game_events = call_api(f"{api_links['game']}{game_id}{api_links['game_events']}")
    game['events'] = []
    for event in game_events['incidents']:
        if event['incidentType'] == 'substitution':
            game['events'].append({
                'type': event['incidentType'],
                'event_class': event['incidentClass'],
                'time': event['time'],
                'is_home': event['isHome'],
                'playerIn': event['playerIn']['slug'],
                'playerIn_short': event['playerIn']['shortName'],
                'playerOut': event['playerOut']['slug'],
                'playerOut_short': event['playerOut']['shortName'],
            })
        elif event['incidentType'] == 'period':
            game['events'].append({
                'type': event['incidentType'],
                'time': event['time'],
            })
        elif event['incidentType'] == 'injuryTime':
            pass
        else:
            game['events'].append({
                'type': event['incidentType'],
                'event_class': event['incidentClass'],
                'time': event['time'],
                'is_home': event['isHome'],
                'player': event['player']['slug'],
                'player_short': event['player']['shortName'],
            })
            if 'assist1' in event:
                game['events'][-1]['assist'] = {
                    'player': event['assist1']['slug'],
                    'player_short': event['assist1']['shortName'],
                }
            if 'from' in event:
                game['events'][-1]['from'] = event['from']
    return game

def get_domination(game, game_id):
    domination = call_api(f"{api_links['game']}{game_id}{api_links['domination']}")
    if 'error' in domination:
        return game
    
    game['domination'] = domination['graphPoints']
    return game

def get_shotmap(game, game_id):
    shotmap = call_api(f"{api_links['game']}{game_id}{api_links['shotmap']}")
    if 'error' in shotmap:
        return game
    
    game['shotmap'] = shotmap['shotmap']
    return game

def get_average_pos(game, game_id):
    average_pos = call_api(f"{api_links['game']}{game_id}{api_links['average_pos']}")
    if 'error' in average_pos:
        return game
    
    game['average_positions'] = {}
    game['average_positions']['home'] = average_pos['home']
    game['average_positions']['away'] = average_pos['away']
    return game

api_links = {
    'game': 'https://www.sofascore.com/api/v1/event/',
    'teams_stats': '/statistics',
    'players_stats': '/lineups',
    'game_events': '/incidents',
    'domination': '/graph',
    'shotmap': '/shotmap',
    'average_pos': '/average-positions',
}

game_ids = get_game_ids()

all_games = []
for game_id in game_ids: 
    game = {}
    game = get_game(game, game_id)
    game = get_teams_stats(game, game_id)
    game = get_players_stats(game, game_id)
    game = get_game_events(game, game_id)
    game = get_domination(game, game_id)
    game = get_shotmap(game, game_id)
    game = get_average_pos(game, game_id)
    all_games.append(game)

all_season = {
    'games': all_games
}
    
write_json('./visualisation-data/public/all_season.json', all_season)

print('Done !')

