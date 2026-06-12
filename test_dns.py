import socket
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')
db_url = os.getenv('DATABASE_URL')
print(f"Testing URL: {db_url}")

host = "db.mzoplgljdhyggcobyazf.supabase.co"
port = 5432

try:
    print(f"Attempting to resolve {host}...")
    addr_info = socket.getaddrinfo(host, port)
    for res in addr_info:
        print(f"Resolved to: {res[4][0]}")
except Exception as e:
    print(f"DNS Resolution failed: {e}")
