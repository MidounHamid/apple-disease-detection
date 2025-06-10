import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv()

# Database Configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', '75948118HDmd'),
    'database': os.getenv('DB_NAME', 'apple_disease_detection')
}

# Security Configuration
SECRET_KEY = os.getenv('SECRET_KEY', 'your_secret_key')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Upload Configuration
UPLOAD_DIR = Path("uploads/images")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)