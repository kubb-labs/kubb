import requests
response = requests.delete("/user/:username")

print(response.status_code)