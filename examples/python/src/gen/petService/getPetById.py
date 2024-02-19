import requests
response = requests.get("/pet/:petId")

print(response.status_code)