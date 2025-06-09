import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv
from config import DB_CONFIG

# Load environment variables
load_dotenv()

def create_database():
    try:
        # First connect without database
        conn = mysql.connector.connect(
            host=DB_CONFIG['host'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password']
        )
        cursor = conn.cursor()
        
        # Create database
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_CONFIG['database']}")
        print(f"Database '{DB_CONFIG['database']}' created successfully")
        
        # Switch to database
        cursor.execute(f"USE {DB_CONFIG['database']}")
        
        # Create users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                is_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("Users table created successfully")
        
        # Create history table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                disease_name VARCHAR(100) NOT NULL,
                confidence FLOAT NOT NULL,            
                image_path VARCHAR(255) NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        """)
        print("History table created successfully")
        
        # Create an admin user if it doesn't exist
        cursor.execute("SELECT COUNT(*) FROM users WHERE is_admin = TRUE")
        admin_count = cursor.fetchone()[0]
        
        if admin_count == 0:
            from werkzeug.security import generate_password_hash
            admin_password = generate_password_hash("admin123")  # Change this password!
            cursor.execute("""
                INSERT INTO users (username, email, password_hash, is_admin) 
                VALUES (%s, %s, %s, %s)
            """, ("admin", "admin@example.com", admin_password, True))
            print("Default admin user created (username: admin, password: admin123)")
            print("WARNING: Please change the admin password after first login!")
        
        conn.commit()
        print("Database setup completed successfully!")
        
    except Error as e:
        print(f"Error: {e}")
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()
            print("Database connection closed")

def main():
    create_database()

if __name__ == "__main__":
    main()