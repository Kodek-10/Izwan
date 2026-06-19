import traceback
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import get_current_user
from app.models import User

def override_get_current_user():
    return User(id=1, username="testuser")

app.dependency_overrides[get_current_user] = override_get_current_user

client = TestClient(app)

try:
    response = client.get("/api/v1/snippets/?limit=1000")
    print(response.status_code)
    print(response.json())
except Exception as e:
    traceback.print_exc()
