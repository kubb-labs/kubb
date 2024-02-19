import requests
response = requests.delete("/pet/:petId")

print(response.status_code)