import requests
response = requests.get("/pet/findByTags")print(response.status_code)