import requests
response = requests.post("/pet/:petId/uploadImage")print(response.status_code)