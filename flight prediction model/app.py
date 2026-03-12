from flask import Flask, request, jsonify, render_template
from flight_logic import FlightPredictor

app = Flask(__name__)

# Initialize Predictor
try:
    predictor = FlightPredictor()
except Exception as e:
    print(f"Failed to load predictor: {e}")
    predictor = None

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    if not predictor:
        return jsonify({"error": "Model not initialized"}), 500
        
    try:
        data = request.json
        # Format types properly
        data['duration'] = float(data.get('duration', 0))
        data['days_left'] = int(data.get('days_left', 1))
        
        # Predict price, get confidence and alerts
        result = predictor.predict(data)
        
        # If it's an error due to days_left > 365
        if "error" in result:
            return jsonify(result), 400
            
        # Get recommendation for best days_left up to 30 days
        recommendation = predictor.recommend_best_date(data)
        result['recommendation'] = recommendation
        
        return jsonify(result)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5002)
