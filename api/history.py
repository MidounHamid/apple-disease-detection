from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.security import OAuth2PasswordBearer
from mysql.connector import Error
from jose import jwt
from typing import List
from pydantic import BaseModel
from datetime import datetime
from config import SECRET_KEY, ALGORITHM, UPLOAD_DIR
from database import get_db_connection
import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)
router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

UPLOAD_DIR = "uploads/images"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/history")
async def create_history(
    file: UploadFile = File(...),
    result: str = Form(...),
    confidence: float = Form(...),
    token: str = Depends(oauth2_scheme)
):
    conn = None
    cursor = None
    try:
        # Verify token and get user_id
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Save uploaded file using pathlib for consistent path handling
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{file.filename}"
        file_path = Path(UPLOAD_DIR) / filename
        
        # Save the file
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_content = await file.read()
        file_path.write_bytes(file_content)
        
        # Store relative path with forward slashes in database
        db_path = str(Path("uploads/images") / filename).replace("\\", "/")
        
        # Save to database
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get user_id
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        cursor.execute(
            """
            INSERT INTO history (user_id, disease_name, confidence, image_path) 
            VALUES (%s, %s, %s, %s)
            """,
            (user['id'], result, confidence, db_path)
        )
        conn.commit()
        
        return {"message": "History entry created successfully"}
        
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Error as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating history: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@router.get("/history")
async def get_history(token: str = Depends(oauth2_scheme)):
    conn = None
    cursor = None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT h.* FROM history h
            JOIN users u ON h.user_id = u.id
            WHERE u.username = %s
            ORDER BY h.timestamp DESC
        """, (username,))
        
        history = cursor.fetchall()
        return history
        
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Error as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@router.delete("/history/{history_id}")
async def delete_history(history_id: int, token: str = Depends(oauth2_scheme)):
    conn = None
    cursor = None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Verify ownership
        cursor.execute("""
            SELECT h.* FROM history h
            JOIN users u ON h.user_id = u.id
            WHERE h.id = %s AND u.username = %s
        """, (history_id, username))
        
        history_item = cursor.fetchone()
        if not history_item:
            raise HTTPException(status_code=404, detail="History item not found")
            
        # Delete image file if it exists
        if history_item['image_path']:
            try:
                os.remove(history_item['image_path'])
            except OSError:
                logger.warning(f"Could not delete image file: {history_item['image_path']}")
        
        # Delete database record
        cursor.execute("DELETE FROM history WHERE id = %s", (history_id,))
        conn.commit()
        
        return {"message": "History item deleted successfully"}
        
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.error(f"Error deleting history: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()