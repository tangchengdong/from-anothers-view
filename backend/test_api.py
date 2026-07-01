import requests

try:
    url = 'http://localhost:8000/api/commentary/generate'
    params = {'news_id': 1575070, 'perspective': 'AI研究员'}
    res = requests.get(url, params=params, timeout=60)
    data = res.json()
    print('Status:', res.status_code)
    print('Response:', data)
except Exception as e:
    print('Error:', str(e))
