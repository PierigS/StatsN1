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

def which_selected_match_day():
    return int(driver.find_element(By.XPATH, '//*[@id="__next"]/main/div/div[3]/div/div[1]/div[1]/div[5]/div/div[3]/div/div/div[1]/div/div[1]/div/button/div/div').text.split(' ')[1])

def call_api(url):
    return requests.get(url).json()

def write_json(file_path, data):
    with open(file_path, 'w', encoding='utf-8') as json_file:
        json.dump(data, json_file, ensure_ascii=False, indent=4)

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
games_id = []
while which_selected_match_day() > 1:
    matchday_number = which_selected_match_day()
    #change la journée sur la dernière jouée
    driver.find_element(By.XPATH, '//*[@id="__next"]/main/div/div[3]/div/div[1]/div[1]/div[5]/div/div[3]/div/div/div[1]/div/div[1]/button[1]').click()

    time.sleep(0.5)

    all_links = driver.find_elements(By.XPATH, '//*[@id="__next"]/main/div/div[3]/div/div[1]/div[1]/div[5]/div/div[3]/div/div/div[1]/div/div[2]//a')
    games_id.extend([link.get_attribute('href').split('#')[1].split(':')[1] for link in all_links if 'match' in link.get_attribute('href')])

driver.close()
api_links = {
    'game': 'https://www.sofascore.com/api/v1/event/',
    'teams_stats': '/statistics',
    'players_stats': '/lineups',
    'shotmap': '/shotmap',
    'game_infos': '/incidents',
    'domination': '/graph',
    'average_pos': '/average-positions',
}

teams_infos = call_api(f"{api_links['game']}{games_id[0]}")

    
game = {}
game['home_team'] = {
    'name': teams_infos['event']['homeTeam']['name'],
    'namecode': teams_infos['event']['homeTeam']['nameCode'],
}
game['away_team'] = {
    'name': teams_infos['event']['awayTeam']['name'],
    'namecode': teams_infos['event']['awayTeam']['nameCode'],
}
game['score'] = {
    'home': teams_infos['event']['homeScore']['current'],
    'away': teams_infos['event']['awayScore']['current'],
}

teams_stats = call_api(f"{api_links['game']}{games_id[0]}{api_links['teams_stats']}")

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
        'home': stat['home'],
        'away': stat['away'],
        'type': stat['statisticsType'],
    }
for stat in teams_stats['statistics'][0]['groups'][1]['statisticsItems']:
    game['statistics']['shots'][stat['key']] = {
        'home': stat['home'],
        'away': stat['away'],
        'type': stat['statisticsType'],
    }
for stat in teams_stats['statistics'][0]['groups'][2]['statisticsItems']:
    game['statistics']['attack'][stat['key']] = {
        'home': stat['home'],
        'away': stat['away'],
        'type': stat['statisticsType'],
    }
for stat in teams_stats['statistics'][0]['groups'][3]['statisticsItems']:
    game['statistics']['passes'][stat['key']] = {
        'home': stat['home'],
        'away': stat['away'],
        'type': stat['statisticsType'],
    }
for stat in teams_stats['statistics'][0]['groups'][4]['statisticsItems']:
    game['statistics']['duels'][stat['key']] = {
        'home': stat['home'],
        'away': stat['away'],
        'type': stat['statisticsType'],
    }
for stat in teams_stats['statistics'][0]['groups'][5]['statisticsItems']:
    game['statistics']['defense'][stat['key']] = {
        'home': stat['home'],
        'away': stat['away'],
        'type': stat['statisticsType'],
    }
for stat in teams_stats['statistics'][0]['groups'][6]['statisticsItems']:
    game['statistics']['goalkeepers'][stat['key']] = {
        'home': stat['home'],
        'away': stat['away'],
        'type': stat['statisticsType'],
    }

players_stats = call_api(f"{api_links['game']}{games_id[0]}{api_links['players_stats']}")

game['players_stats'] = {}
game['players_stats']['home'] = {}
game['players_stats']['away'] = {}
for player in players_stats['home']['players']:
    if 'statistics' in player:
        game['players_stats']['home'][player['player']['slug']] = {}
        game['players_stats']['home'][player['player']['slug']]['position'] = player['position']
        game['players_stats']['home'][player['player']['slug']]['statistics'] = player['statistics']
for player in players_stats['away']['players']:
    if 'statistics' in player:
        game['players_stats']['away'][player['player']['slug']] = {}
        game['players_stats']['away'][player['player']['slug']]['position'] = player['position']
        game['players_stats']['away'][player['player']['slug']]['statistics'] = player['statistics']
    
write_json('./game.json', game)

print('Done !')

