import pytest
from app import app
import json

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_home_page(client):
    rv = client.get('/')
    assert rv.status_code == 200
    assert b'AI Flight Forecaster' in rv.data

def test_predict_success(client):
    payload = {
        "airline": "Vistara",
        "source_city": "Delhi",
        "departure_time": "Morning",
        "stops": "zero",
        "arrival_time": "Evening",
        "destination_city": "Mumbai",
        "class": "Economy",
        "duration": 2.5,
        "days_left": 15
    }
    
    rv = client.post('/predict', data=json.dumps(payload), content_type='application/json')
    assert rv.status_code == 200
    
    data = json.loads(rv.data)
    assert 'predicted_price' in data
    assert 'confidence_score' in data
    assert 'recommendation' in data
    assert 0 <= data['confidence_score'] <= 100

def test_edge_case_days_left(client):
    payload = {
        "airline": "Vistara",
        "source_city": "Delhi",
        "departure_time": "Morning",
        "stops": "zero",
        "arrival_time": "Evening",
        "destination_city": "Mumbai",
        "class": "Economy",
        "duration": 2.5,
        "days_left": 400
    }
    
    rv = client.post('/predict', data=json.dumps(payload), content_type='application/json')
    assert rv.status_code == 400
    data = json.loads(rv.data)
    assert 'error' in data
    assert '365' in data['error']
