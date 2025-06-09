from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
import mysql.connector
from mysql.connector import Error
from werkzeug.security import generate_password_hash, check_password_hash
from jose import jwt
import os
import logging
import re
from dotenv import load_dotenv
from datetime import datetime, timedelta
from history import router as history_router
from config import DB_CONFIG, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from database import get_db_connection  # Import from database module

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# FastAPI app initialization
app = FastAPI()

# Include the history router
app.include_router(history_router)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Pydantic Models with Validation
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    is_admin: Optional[bool] = False

    @validator('username')
    def validate_username(cls, v):
        if not re.match(r'^[a-zA-Z0-9_]{3,20}$', v):
            raise ValueError('Username must be 3-20 characters long and contain only letters, numbers, and underscores')
        return v

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        return v

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_admin: bool

# Token Generation
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# User Signup
@app.post("/signup")
async def signup(user: UserCreate):
    conn = None
    cursor = None
    try:
        # Log detailed signup attempt
        logger.info(f"Signup attempt: username={user.username}, email={user.email}")
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Check if username or email already exists
        cursor.execute("SELECT * FROM users WHERE username = %s OR email = %s", 
                       (user.username, user.email))
        existing_user = cursor.fetchone()
        
        if existing_user:
            if existing_user['username'] == user.username:
                raise HTTPException(
                    status_code=409, 
                    detail="Username already exists. Please choose a different username."
                )
            else:
                raise HTTPException(
                    status_code=409, 
                    detail="Email already exists. Please use a different email."
                )

        # Hash the password
        hashed_password = generate_password_hash(user.password)

        # Insert new user
        cursor.execute(
            "INSERT INTO users (username, email, password_hash, is_admin) VALUES (%s, %s, %s, %s)", 
            (user.username, user.email, hashed_password, user.is_admin)
        )
        conn.commit()
        
        logger.info(f"User {user.username} created successfully")
        return {"message": "User created successfully", "is_admin": user.is_admin}
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Error as e:
        logger.error(f"Database error during signup: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Database error: {str(e)}. "
                   "Please check your database configuration and try again."
        )
    except Exception as e:
        logger.error(f"Unexpected error during signup: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Unexpected error: {str(e)}"
        )
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# User Login
@app.post("/login")
async def login(user: UserLogin):
    conn = None
    cursor = None
    try:
        logger.info(f"Login attempt for username: {user.username}")
        
        # Validate input
        if not user.username or not user.password:
            logger.warning("Login attempt with empty username or password")
            raise HTTPException(
                status_code=400,
                detail="Username and password are required"
            )

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Fetch user by username
        cursor.execute("SELECT * FROM users WHERE username = %s", (user.username,))
        db_user = cursor.fetchone()

        if not db_user:
            logger.warning(f"Login failed: User not found - {user.username}")
            raise HTTPException(
                status_code=401,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Verify password
        if not check_password_hash(db_user['password_hash'], user.password):
            logger.warning(f"Login failed: Incorrect password for user - {user.username}")
            raise HTTPException(
                status_code=401,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Create access token
        access_token = create_access_token(
            data={"sub": db_user['username'], "is_admin": db_user['is_admin']}
        )

        logger.info(f"Successful login for user: {user.username}")
        
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "user_id": db_user['id'], 
            "is_admin": db_user['is_admin']
        }
    
    except HTTPException:
        raise
    except Error as e:
        logger.error(f"Database error during login: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error during login: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# Admin-only route to get all users
@app.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(token: str = Depends(oauth2_scheme)):
    try:
        # Decode and verify token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        is_admin = payload.get("is_admin")
        
        if not is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT id, username, email, is_admin FROM users")
        users = cursor.fetchall()
        
        return users
    
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    except Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()

# Main entry point
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)