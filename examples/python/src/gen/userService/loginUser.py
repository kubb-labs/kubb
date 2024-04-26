import requests
response = requests.get("/user/login")

print(response.status_code)