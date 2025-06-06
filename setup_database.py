import mysql.connector
from mysql.connector import Error
import os
import sys
import traceback
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_database_and_tables():
    connection = None
    try:
        # Print environment variables for debugging
        print("Database Configuration:")
        print(f"Host: {os.getenv('DB_HOST', 'localhost')}")
        print(f"User: {os.getenv('DB_USER', 'root')}")
        print(f"Database: {os.getenv('DB_NAME', 'apple_disease_detection')}")

        # Connect to MySQL server
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', '75948118HDmd')
        )
        
        cursor = connection.cursor()
        
        # Create database
        cursor.execute("CREATE DATABASE IF NOT EXISTS apple_disease_detection")
        print("Database created successfully")
        
        # Connect to the specific database
        connection.database = 'apple_disease_detection'
        
        # Create Users Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            is_admin BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """)
        print("Users table created successfully")
        
        # Create History Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            action_type VARCHAR(50) NOT NULL,
            details TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        """)
        print("History table created successfully")
        
        connection.commit()
    except Error as e:
        print(f"MySQL Connector Error: {e}")
        print("Detailed Error Traceback:")
        traceback.print_exc()
    except Exception as e:
        print(f"Unexpected Error: {e}")
        print("Detailed Error Traceback:")
        traceback.print_exc()
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()
            print("MySQL connection is closed")

if __name__ == "__main__":
    create_database_and_tables()
    sys.exit(0)  # Explicitly exit with success code 