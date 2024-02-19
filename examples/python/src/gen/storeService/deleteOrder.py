import requests
response = requests.delete("/store/order/:orderId")print(response.status_code)