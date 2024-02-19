import requests
response = requests.post("/user/createWithList")print(response.status_code)