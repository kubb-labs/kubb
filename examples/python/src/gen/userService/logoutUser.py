import requests
response = requests.get("/user/logout")print(response.status_code)