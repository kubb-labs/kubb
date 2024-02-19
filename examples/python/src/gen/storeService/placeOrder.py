import requests
response = requests.post("/store/order")print(response.status_code)