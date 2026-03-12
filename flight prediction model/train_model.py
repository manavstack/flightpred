import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from xgboost import XGBRegressor
import joblib
import numpy as np
import time

def train_and_save_model():
    print("Loading dataset...")
    df = pd.read_csv('./data/Clean_Dataset.csv')

    # Drop unnecessary columns
    if 'Unnamed: 0' in df.columns:
        df = df.drop(columns=['Unnamed: 0'])
    if 'flight' in df.columns:
        df = df.drop(columns=['flight'])

    X = df.drop(columns=['price'])
    y = df['price']

    # For faster training, sample a fraction if needed, but 300k with these params is usually fine on max_depth=12
    # We will just train on the whole dataset since n_estimators is small (30)
    print(f"Dataset size: {X.shape}")

    categorical_features = ['airline', 'source_city', 'departure_time', 'stops', 'arrival_time', 'destination_city', 'class']
    numerical_features = ['duration', 'days_left']

    # Preprocessing pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numerical_features),
            ('cat', OneHotEncoder(drop='first', sparse_output=False, handle_unknown='ignore'), categorical_features)
        ]
    )

    # XGBoost Regressor
    # Extremely low file size compared to Random Forest and high accuracy
    model = XGBRegressor(
        n_estimators=150, 
        max_depth=8, 
        learning_rate=0.1,
        n_jobs=-1, 
        random_state=42
    )

    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('model', model)
    ])

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training model...")
    start_time = time.time()
    pipeline.fit(X_train, y_train)
    print(f"Training completed in {time.time() - start_time:.2f} seconds.")

    # Evaluate
    score = pipeline.score(X_test, y_test)
    print(f"Test R^2 Score: {score:.4f}")

    # Save the pipeline
    joblib.dump(pipeline, 'flight_price_model.pkl')
    print("Model saved as flight_price_model.pkl")

if __name__ == '__main__':
    train_and_save_model()
