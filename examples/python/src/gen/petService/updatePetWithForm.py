import requests
response = requests.post("/pet/:petId")print(response.status_code)