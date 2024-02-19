import requests
response = requests.get("/pet/findByStatus")

print(response.status_code)