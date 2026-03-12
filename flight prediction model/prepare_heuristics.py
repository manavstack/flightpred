import pandas as pd
import json

def generate_averages():
    df = pd.read_csv('./data/Clean_Dataset.csv')
    # Use mean price for Source -> Destination -> Class
    avg_df = df.groupby(['source_city', 'destination_city', 'class'])['price'].mean().reset_index()
    
    lookup_dict = {}
    for _, row in avg_df.iterrows():
        key = f"{row['source_city']}_{row['destination_city']}_{row['class']}"
        lookup_dict[key] = row['price']
        
    with open('route_averages.json', 'w') as f:
        json.dump(lookup_dict, f)
        
    print("Generated route_averages.json!")

if __name__ == '__main__':
    generate_averages()
