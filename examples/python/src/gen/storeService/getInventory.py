import requests
response = requests.get("/store/inventory")print(response.status_code)