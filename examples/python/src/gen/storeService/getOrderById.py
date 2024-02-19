import requests
response = requests.get("/store/order/:orderId")

print(response.status_code)