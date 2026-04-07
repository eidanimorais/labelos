from passlib.context import CryptContext
import sys

try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    h = pwd_context.hash("test")
    print(f"Hash: {h}")
    print(f"Verify: {pwd_context.verify('test', h)}")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
