import sys
import os
sys.path.append(os.getcwd())

try:
    from backend import main
    print("Backend imports successfully!")
except Exception as e:
    print(f"Error importing backend: {e}")
    import traceback
    traceback.print_exc()
