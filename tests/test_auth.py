import pytest
from fastapi.testclient import TestClient


class TestUserRegistration:
    def test_signup_creates_user(self, client: TestClient):
        response = client.post("/api/auth/signup", json={
            "email": "test@example.com",
            "password": "securepassword123",
            "first_name": "Test",
            "last_name": "User"
        })
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["first_name"] == "Test"
        assert data["last_name"] == "User"
        assert "id" in data
        assert "password" not in data
        assert "password_hash" not in data

    def test_signup_requires_email(self, client: TestClient):
        response = client.post("/api/auth/signup", json={
            "password": "securepassword123"
        })
        assert response.status_code == 422

    def test_signup_requires_password(self, client: TestClient):
        response = client.post("/api/auth/signup", json={
            "email": "test@example.com"
        })
        assert response.status_code == 422

    def test_signup_rejects_duplicate_email(self, client: TestClient):
        client.post("/api/auth/signup", json={
            "email": "test@example.com",
            "password": "securepassword123"
        })
        response = client.post("/api/auth/signup", json={
            "email": "test@example.com",
            "password": "differentpassword"
        })
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()

    def test_signup_validates_email_format(self, client: TestClient):
        response = client.post("/api/auth/signup", json={
            "email": "notanemail",
            "password": "securepassword123"
        })
        assert response.status_code == 422


class TestUserLogin:
    def test_login_with_valid_credentials(self, client: TestClient):
        client.post("/api/auth/signup", json={
            "email": "test@example.com",
            "password": "securepassword123"
        })
        response = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "securepassword123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_with_invalid_password(self, client: TestClient):
        client.post("/api/auth/signup", json={
            "email": "test@example.com",
            "password": "securepassword123"
        })
        response = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()

    def test_login_with_nonexistent_user(self, client: TestClient):
        response = client.post("/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "password123"
        })
        assert response.status_code == 401


class TestAuthenticatedRoutes:
    def test_get_current_user(self, client: TestClient):
        client.post("/api/auth/signup", json={
            "email": "test@example.com",
            "password": "securepassword123"
        })
        login_response = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "securepassword123"
        })
        token = login_response.json()["access_token"]
        
        response = client.get("/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"

    def test_get_current_user_without_token(self, client: TestClient):
        response = client.get("/api/auth/me")
        assert response.status_code == 401

    def test_get_current_user_with_invalid_token(self, client: TestClient):
        response = client.get("/api/auth/me", headers={
            "Authorization": "Bearer invalidtoken"
        })
        assert response.status_code == 401


class TestLogout:
    def test_logout(self, client: TestClient):
        client.post("/api/auth/signup", json={
            "email": "test@example.com",
            "password": "securepassword123"
        })
        login_response = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "securepassword123"
        })
        token = login_response.json()["access_token"]
        
        response = client.post("/api/auth/logout", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
