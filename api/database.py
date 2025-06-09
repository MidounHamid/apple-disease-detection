import mysql.connector
from mysql.connector import Error
from fastapi import HTTPException
import logging
from config import DB_CONFIG

# Configure logging
logger = logging.getLogger(__name__)

def get_db_connection():
    """
    Create and return a MySQL database connection.
    Raises HTTPException if connection fails.
    """
    try:
        logger.info(f"Attempting to connect to database with config: {DB_CONFIG}")
        connection = mysql.connector.connect(**DB_CONFIG)
        logger.info("Database connection successful")
        return connection
    except Error as e:
        logger.error(f"Database connection error: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Database connection error: {str(e)}. "
                   f"Please check your database configuration. "
                   f"Host: {DB_CONFIG['host']}, User: {DB_CONFIG['user']}, "
                   f"Database: {DB_CONFIG['database']}"
        )