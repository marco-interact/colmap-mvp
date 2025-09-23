"""
Demo authentication system for local development
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
from passlib.context import CryptContext1g

router = APIRouter()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Demo users (in production, these would be in a database)
DEMO_USERS = {
    "demo": {
        "id": 1,
        "username": "demo",
        "email": "demo@3dplatform.com",
        "full_name": "Demo User",
        "hashed_password": pwd_context.hash("demo123"),  # password: demo123
        "is_active": True,
        "created_at": "2024-01-01T00:00:00"
    },
    "admin": {
        "id": 2,
        "username": "admin",
        "email": "admin@3dplatform.com", 
        "full_name": "Admin User",
        "hashed_password": pwd_context.hash("admin123"),  # password: admin123
        "is_active": True,
        "created_at": "2024-01-01T00:00:00"
    },
    "testuser": {
        "id": 3,
        "username": "testuser",
        "email": "test@3dplatform.com",
        "full_name": "Test User",
        "hashed_password": pwd_context.hash("test123"),  # password: test123
        "is_active": True,
        "created_at": "2024-01-01T00:00:00"
    }
}

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    is_active: bool
    created_at: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)

def authenticate_user(username: str, password: str) -> Optional[dict]:
    """Authenticate a user."""
    user = DEMO_USERS.get(username)
    if not user:
        return None
    if not verify_password(password, user["hashed_password"]):
        return None
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create an access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=60)  # 1 hour default
    to_encode.update({"exp": expire})
    # Use a simple secret for demo
    encoded_jwt = jwt.encode(to_encode, "demo-secret-key", algorithm="HS256")
    return encoded_jwt

@router.post("/auth/login", response_model=Token)
async def login(login_data: LoginRequest):
    """
    Demo login endpoint.
    
    Demo credentials:
    - username: demo, password: demo123
    - username: admin, password: admin123  
    - username: testuser, password: test123
    """
    user = authenticate_user(login_data.username, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    access_token_expires = timedelta(minutes=60)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    
    user_response = UserResponse(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        full_name=user["full_name"],
        is_active=user["is_active"],
        created_at=user["created_at"]
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user_response
    }

@router.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: RegisterRequest):
    """
    Demo registration endpoint.
    """
    # Check if user already exists
    if user_data.username in DEMO_USERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    for user in DEMO_USERS.values():
        if user["email"] == user_data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # Create new user
    new_user_id = max([user["id"] for user in DEMO_USERS.values()]) + 1
    new_user = {
        "id": new_user_id,
        "username": user_data.username,
        "email": user_data.email,
        "full_name": user_data.full_name,
        "hashed_password": get_password_hash(user_data.password),
        "is_active": True,
        "created_at": datetime.utcnow().isoformat()
    }
    
    # Add to demo users (in production, this would be saved to database)
    DEMO_USERS[user_data.username] = new_user
    
    return UserResponse(
        id=new_user["id"],
        username=new_user["username"],
        email=new_user["email"],
        full_name=new_user["full_name"],
        is_active=new_user["is_active"],
        created_at=new_user["created_at"]
    )

@router.get("/auth/me", response_model=UserResponse)
async def get_current_user():
    """
    Get current user info (demo version - returns demo user)
    """
    demo_user = DEMO_USERS["demo"]
    return UserResponse(
        id=demo_user["id"],
        username=demo_user["username"],
        email=demo_user["email"],
        full_name=demo_user["full_name"],
        is_active=demo_user["is_active"],
        created_at=demo_user["created_at"]
    )

@router.get("/auth/demo-users")
async def list_demo_users():
    """
    List all available demo users (for development only)
    """
    return {
        "available_demo_users": [
            {"username": "demo", "password": "demo123", "description": "Regular demo user"},
            {"username": "admin", "password": "admin123", "description": "Admin demo user"},
            {"username": "testuser", "password": "test123", "description": "Test user"}
        ]
    }
