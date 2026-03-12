import pandas as pd
import numpy as np
import joblib
import json

class FlightPredictor:
    def __init__(self, model_path='flight_price_model.pkl', heuristics_path='route_averages.json'):
        self.pipeline = joblib.load(model_path)
        with open(heuristics_path, 'r') as f:
            self.route_averages = json.load(f)

    def _get_confidence(self, input_df):
        """
        Calculate predictions and confidence scores based on tree variance.
        """
        model = self.pipeline.named_steps['model']
        preprocessor = self.pipeline.named_steps['preprocessor']
        
        X_transformed = preprocessor.transform(input_df)
        
        preds = []
        for estimator in model.estimators_:
            preds.append(estimator.predict(X_transformed))
        
        preds = np.array(preds)
        std_devs = np.std(preds, axis=0)
        means = np.mean(preds, axis=0)
        
        # Heuristic to map variance to 0-100 score
        # Using Coefficient of Variation (CV)
        # CV near 0 -> high confidence (100)
        # CV near 0.25+ -> low confidence (0)
        cv = std_devs / (means + 1e-9)
        conf_scores = np.clip(100 - (cv * 400), 0, 100)
        
        return means, conf_scores

    def predict(self, input_dict):
        """
        input_dict keys: airline, source_city, departure_time, stops, arrival_time, destination_city, class, duration, days_left
        """
        if int(input_dict.get('days_left', 0)) > 365:
            return {"error": "Cannot predict flights more than 365 days in advance."}
            
        df = pd.DataFrame([input_dict])
        mean_prices, conf_scores = self._get_confidence(df)
        predicted_price = float(mean_prices[0])
        confidence = float(conf_scores[0])
        
        # Check alerts
        key = f"{input_dict['source_city']}_{input_dict['destination_city']}_{input_dict.get('class', 'Economy')}"
        avg_price = self.route_averages.get(key, None)
        alert = None
        if avg_price and predicted_price > avg_price * 1.3:
            alert = f"Price Hike Alert: Predicted price is significantly higher than historical average of {avg_price:.0f} INR."
            
        return {
            "predicted_price": round(predicted_price, 2),
            "confidence_score": round(confidence, 1),
            "alert": alert
        }

    def recommend_best_date(self, base_input_dict):
        """
        Sweep through next 30 days to find lowest fare for the requested flight info.
        """
        df_list = []
        for d in range(1, 31):
            temp = base_input_dict.copy()
            temp['days_left'] = d
            df_list.append(temp)
            
        df = pd.DataFrame(df_list)
        means, confs = self._get_confidence(df)
        
        best_idx = np.argmin(means)
        
        return {
            "best_days_left": int(df_list[best_idx]['days_left']),
            "best_price": round(float(means[best_idx]), 2),
            "confidence_score": round(float(confs[best_idx]), 1)
        }
