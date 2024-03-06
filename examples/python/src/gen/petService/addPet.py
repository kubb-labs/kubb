import requests
response = requests.post("/pet")

print(response.status_code)