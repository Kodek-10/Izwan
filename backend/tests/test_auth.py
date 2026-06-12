def test_register_user(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"username": "testuser", "password": "testpassword"}
    )
    assert response.status_code == 200
    assert response.json()["username"] == "testuser"

def test_login_user(client):
    # Register first
    client.post(
        "/api/v1/auth/register",
        json={"username": "loginuser", "password": "loginpassword"}
    )
    
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "loginuser", "password": "loginpassword"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
