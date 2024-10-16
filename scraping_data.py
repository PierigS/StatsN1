from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium_stealth import stealth
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException, TimeoutException

import json
import time

def which_selected_match_day():
    return int(driver.find_element(By.XPATH, '//*[@id="__next"]/main/div/div[3]/div/div[1]/div[1]/div[5]/div/div[3]/div/div/div[1]/div/div[1]/div/button/div/div').text.split(' ')[1])

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

#change la journée sur la dernière jouée
driver.find_element(By.XPATH, '//*[@id="__next"]/main/div/div[3]/div/div[1]/div[1]/div[5]/div/div[3]/div/div/div[1]/div/div[1]/button[1]').click()

matchday = which_selected_match_day()

game_main_stats = {
    'possession': {
        'home': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[3]/div/div[1]/div[2]/div/div[1]/div[1]/bdi[1]/span',
        'home_bis': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[5]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[1]/div[1]/bdi[1]/span',
        'home_ter': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[1]/div[1]/bdi[1]/span',
        'away': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[3]/div/div[1]/div[2]/div/div[1]/div[1]/bdi[3]/span',
        'away_bis': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[5]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[1]/div[1]/bdi[3]/span',
        'away_ter': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[1]/div[1]/bdi[3]/span',
    },
    'xG': {
        'home': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[3]/div/div[1]/div[2]/div/div[2]/div[1]/bdi[1]/span',
        'home_bis': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[5]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[2]/div[1]/bdi[1]/span',
        'home_ter': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[2]/div[1]/bdi[1]/span',
        'away': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[3]/div/div[1]/div[2]/div/div[2]/div[1]/bdi[3]/span',
        'away_bis': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[5]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[2]/div[1]/bdi[3]/span',
        'away_ter': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[2]/div[1]/bdi[3]/span',
    },
    'shots': {
        'home': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[3]/div/div[1]/div[2]/div/div[3]/div[1]/bdi[1]/span',
        'home_bis': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[5]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[3]/div[1]/bdi[1]/span',
        'home_ter': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[3]/div[1]/bdi[1]/span',
        'away': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[3]/div/div[1]/div[2]/div/div[3]/div[1]/bdi[3]/span',
        'away_bis': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[5]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[3]/div[1]/bdi[3]/span',
        'away_ter': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[3]/div[1]/bdi[3]/span',
    },
    'gk_save': {
        'home': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[3]/div/div[1]/div[2]/div/div[4]/div[1]/bdi[1]/span',
        'home_bis': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[5]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[4]/div[1]/bdi[1]/span',
        'home_ter': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[4]/div[1]/bdi[1]/span',
        'away': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[3]/div/div[1]/div[2]/div/div[4]/div[1]/bdi[3]/span',
        'away_bis': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[5]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[4]/div[1]/bdi[3]/span',
        'away_ter': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[4]/div[1]/bdi[3]/span',
    },
    'corner': {
        'home': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[3]/div/div[1]/div[2]/div/div[5]/div[1]/bdi[1]/span',
        'home_bis': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[5]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[5]/div[1]/bdi[1]/span',
        'home_ter': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[5]/div[1]/bdi[1]/span',
        'away': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[3]/div/div[1]/div[2]/div/div[5]/div[1]/bdi[3]/span',
        'away_bis': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[5]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[5]/div[1]/bdi[3]/span',
        'away_ter': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[5]/div[1]/bdi[3]/span',
    },
    'fouls': {
        'home': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[3]/div/div[1]/div[2]/div/div[6]/div[1]/bdi[1]/span',
        'home_bis': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[5]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[6]/div[1]/bdi[1]/span',
        'home_ter': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[6]/div[1]/bdi[1]/span',
        'away': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[3]/div/div[1]/div[2]/div/div[6]/div[1]/bdi[3]/span',
        'away_bis': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[5]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[6]/div[1]/bdi[3]/span',
        'away_ter': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[6]/div[1]/bdi[3]/span',
    },
    'passes': {
        'home': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[3]/div/div[1]/div[2]/div/div[7]/div[1]/bdi[1]/span',
        'home_bis': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[5]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[7]/div[1]/bdi[1]/span',
        'home_ter': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[7]/div[1]/bdi[1]/span',
        'away': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[3]/div/div[1]/div[2]/div/div[7]/div[1]/bdi[3]/span',
        'away_bis': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[5]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[7]/div[1]/bdi[3]/span',
        'away_ter': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[7]/div[1]/bdi[3]/span',
    },
    'tackles': {
        'home': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[3]/div/div[1]/div[2]/div/div[8]/div[1]/bdi[1]/span',
        'home_bis': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[5]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[8]/div[1]/bdi[1]/span',
        'home_ter': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[8]/div[1]/bdi[1]/span',
        'away': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[3]/div/div[1]/div[2]/div/div[8]/div[1]/bdi[3]/span',
        'away_bis': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[5]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[8]/div[1]/bdi[3]/span',
        'away_ter': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[8]/div[1]/bdi[3]/span',
    },
    'free_kick': {
        'home': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[3]/div/div[1]/div[2]/div/div[9]/div[1]/bdi[1]/span',
        'home_bis': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[5]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[9]/div[1]/bdi[1]/span',
        'home_ter': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[9]/div[1]/bdi[1]/span',
        'away': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[3]/div/div[1]/div[2]/div/div[9]/div[1]/bdi[3]/span',
        'away_bis': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[5]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[9]/div[1]/bdi[3]/span',
        'away_ter': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[9]/div[1]/bdi[3]/span',
    },
    'yellow_card': {
        'home': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[3]/div/div[1]/div[2]/div/div[10]/div[1]/bdi[1]/span',
        'home_bis': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[5]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[10]/div[1]/bdi[1]/span',
        'home_ter': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[10]/div[1]/bdi[1]/span',
        'away': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[3]/div/div[1]/div[2]/div/div[10]/div[1]/bdi[3]/span',
        'away_bis': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[5]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[10]/div[1]/bdi[3]/span',
        'away_ter': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[10]/div[1]/bdi[3]/span',
    },
    'red_card': {
        'home': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[3]/div/div[1]/div[2]/div/div[11]/div[1]/bdi[1]/span',
        'home_bis': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[5]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[11]/div[1]/bdi[1]/span',
        'home_ter': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[11]/div[1]/bdi[1]/span',
        'away': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[3]/div/div[1]/div[2]/div/div[11]/div[1]/bdi[3]/span',
        'away_bis': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[5]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[11]/div[1]/bdi[3]/span',
        'away_ter': '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[6]/div/div[2]/div/div[2]/div/div[1]/div[2]/div/div[11]/div[1]/bdi[3]/span',
    },
    
}
missing_stats = []
time.sleep(0.5)

all_links = driver.find_elements(By.XPATH, '//*[@id="__next"]/main/div/div[3]/div/div[1]/div[1]/div[5]/div/div[3]/div/div/div[1]/div/div[2]//a')
links = [link.get_attribute('href') for link in all_links if 'match' in link.get_attribute('href')]

# Stocker la fenêtre principale
main_window = driver.current_window_handle
all_games = {}
games = []
i = 0
# Ouvrir chaque lien dans un nouvel onglet, faire des opérations, puis revenir à l'onglet principal
for link in links:
    # Ouvrir le lien dans un nouvel onglet
    driver.execute_script("window.open(arguments[0], '_blank');", link)
    
    # Attendre un moment pour que la page se charge
    time.sleep(2)
    
    # Basculer vers le nouvel onglet
    driver.switch_to.window(driver.window_handles[-1])
    good = False
    try:
        driver.execute_script("window.scrollBy(0, window.innerHeight);")  # Scroll d'une hauteur d'écran
        time.sleep(0.1) 
        driver.execute_script("window.scrollBy(0, window.innerHeight);")  # Scroll d'une hauteur d'écran
        time.sleep(0.1) 
        driver.execute_script("window.scrollBy(0, window.innerHeight);")  # Scroll d'une hauteur d'écran
        time.sleep(0.1)
        driver.execute_script("window.scrollBy(0, window.innerHeight);")  # Scroll d'une hauteur d'écran
        time.sleep(0.1) 
        driver.execute_script("window.scrollBy(0, window.innerHeight);")  # Scroll d'une hauteur d'écran
        time.sleep(0.1)  
        # Vérifier la présence de l'encart contenant les stats
        stats_header = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//span[text()='Statistiques']"))
        )

        good = True
    except TimeoutException:
        print("Erreur : L'élément 'Statistiques' n'a pas été trouvé dans le temps imparti.")
        # Optionnel : Gérer le cas où l'élément n'est pas présent
        missing_text = driver.find_element(By.XPATH, '//*[@id="__next"]/main/div[2]/div[1]/div/div/div/div[1]/div[1]/bdi').text
        missing_stats.append(str(missing_text + f' - Day {matchday}'))
    except NoSuchElementException:
        # Si les stats ne sont pas présentes, récupérer le texte de l'autre élément et l'ajouter à la liste missing_stats
        missing_text = driver.find_element(By.XPATH, '//*[@id="__next"]/main/div[2]/div[1]/div/div/div/div[1]/div[1]/bdi').text
        missing_stats.append(str(missing_text+ f' - Day {matchday}'))

    if good == True:
        try:
            home_team = driver.find_element(By.XPATH, '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[1]/div/div/div[1]/div[1]/div[1]/div/a/div/div/bdi').text
            away_team = driver.find_element(By.XPATH, '//*[@id="__next"]/main/div[2]/div[2]/div[1]/div[1]/div[1]/div/div/div[1]/div[1]/div[3]/div/a/div/div/bdi').text

            games.append({})
            games[i]['teams'] = {'home': home_team, 'away': away_team}
            games[i]['main_stats'] = {}
            for elem in game_main_stats:
                home = driver.find_element(By.XPATH, game_main_stats[elem]['home']).text
                away = driver.find_element(By.XPATH, game_main_stats[elem]['away']).text
                games[i]['main_stats'][elem] = {'home': home, 'away': away}
            i += 1
        except NoSuchElementException:
            try:
                for elem in game_main_stats:
                    print(elem)
                    home = driver.find_element(By.XPATH, game_main_stats[elem]['home_bis']).text
                    away = driver.find_element(By.XPATH, game_main_stats[elem]['away_bis']).text
                    games[i]['main_stats'][elem] = {'home': home, 'away': away}
                i += 1
            except NoSuchElementException as e:
                try:
                    for elem in game_main_stats:
                        print(elem)
                        home = driver.find_element(By.XPATH, game_main_stats[elem]['home_ter']).text
                        away = driver.find_element(By.XPATH, game_main_stats[elem]['away_ter']).text
                        games[i]['main_stats'][elem] = {'home': home, 'away': away}
                    i += 1
                except NoSuchElementException as e:
                    print(e)
            

    # Revenir à l'onglet principal
    driver.close()  # Ferme l'onglet courant (le nouvel onglet)
    driver.switch_to.window(main_window)  # Revenir à l'onglet principal

i = 0
for game in games:
    i+=1
    all_games[f'Game_{i}'] = game
all_games['missing'] = missing_stats
print(all_games)

with open('./all_games.json', 'w', encoding='utf-8') as json_file:
    json.dump(all_games, json_file, ensure_ascii=False, indent=4)

print('Done !')

