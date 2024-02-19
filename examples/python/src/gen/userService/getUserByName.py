import requests
response = requests.get("/user/:username")

print(response.status_code)