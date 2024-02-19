import requests
response = requests.post("/pets/:uuid")print(response.status_code)