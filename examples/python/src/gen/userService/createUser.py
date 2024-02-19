import requests
response = requests.post("/user")print(response.status_code)