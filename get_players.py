from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import json
import time

def fetch_data_with_selenium(event_id):
    url = f"https://www.sofascore.com/api/v1/event/{event_id}/lineups"
    
    # Configurer et lancer le navigateur Selenium
    options = webdriver.ChromeOptions()
    options.add_argument("--headless")  # Exécuter en mode sans tête si vous n'avez pas besoin de voir le navigateur
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    
    # Accéder à l'URL
    driver.get(url)
    time.sleep(2)  # Attendre que la page charge les données
    
    # Récupérer le contenu de la page
    page_source = driver.find_element("tag name", "pre").text  # Assure de récupérer le JSON brut

    # Fermer le navigateur
    driver.quit()

    # Charger les données JSON
    data = json.loads(page_source)
    return data

def main():
    # Charger les IDs des événements depuis ids.json
    with open("./visualisation-data/public/ids.json", "r", encoding="utf-8") as f:
        ids = json.load(f)
    
    all_players_data = {}

    for event_id in ids:
        print(f"Traitement de l'ID : {event_id}")
        data = fetch_data_with_selenium(event_id)
        if 'error' not in data:
            players_data = {}
            for team_key in ['home', 'away']:
                for player in data[team_key]['players']:
                    player_id = player['player']['id']
                    if player_id not in players_data:
                        players_data[player_id] = {
                            'player': player['player'],
                            'games': []
                        }
                    players_data[player_id]['teamId'] = player['teamId']
                    game_data = {
                        'gameId': event_id,
                        'statistics': player.get('statistics', {}),
                        'substitute': player.get('substitute', None),
                        'position': player.get('position', None)
                    }
                    players_data[player_id]['games'].append(game_data)

            # Intégrer dans les données globales
            for player_id, player_info in players_data.items():
                if player_id not in all_players_data:
                    all_players_data[player_id] = player_info
                else:
                    all_players_data[player_id]['games'].extend(player_info['games'])

    # Enregistrer les données
    with open("./visualisation-data/public/players.json", "w", encoding="utf-8") as f:
        json.dump(all_players_data, f, ensure_ascii=False, indent=4)
    print("Toutes les données des joueurs ont été sauvegardées dans players.json.")

# Exécuter le script
main()
