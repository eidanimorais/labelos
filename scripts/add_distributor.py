import pandas as pd
import os

file_path = "data/uploads/2018-distrokid.csv"

# Check if file exists
if not os.path.exists(file_path):
    print(f"Error: File {file_path} not found.")
    exit(1)

try:
    df = pd.read_csv(file_path)
    df["DISTRIBUIDORA"] = "DistroKid"
    df.to_csv(file_path, index=False)
    print(f"Success: Added column 'DISTRIBUIDORA' with value 'DistroKid' to {file_path}")
except Exception as e:
    print(f"Error processing file: {e}")
