import requests

response = requests.put("/user/:username")

print(response.status_code)