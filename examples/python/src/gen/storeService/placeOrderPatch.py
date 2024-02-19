import requests
response = requests.patch("/store/order")print(response.status_code)