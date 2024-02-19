import requests
response = requests.put("/pet")print(response.status_code)