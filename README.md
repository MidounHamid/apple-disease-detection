# Apple Disease Detection - User Authentication System

## Features

- User Registration with Optional Admin Privileges
- Secure Login System
- Role-Based Access Control
- Login History Tracking
- Apple Disease Detection Functionality

## Prerequisites

- Python 3.8+
- MySQL Server
- pip (Python package manager)

## Environment Configuration

### .env File

Create a `.env` file in the project root with the following configurations:

```
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=apple_disease_detection
SECRET_KEY=your_very_secret_key_here
FLASK_ENV=development
DEBUG=True
```

### Configuration Details

- `DB_HOST`: MySQL server host (default: localhost)
- `DB_USER`: MySQL username
- `DB_PASSWORD`: MySQL password
- `DB_NAME`: Database name
- `SECRET_KEY`: Used for session and security purposes
- `FLASK_ENV`: Development or production
- `DEBUG`: Enable/disable debug mode

## Setup Instructions

1. Clone the repository

```bash
git clone https://github.com/yourusername/apple-disease-detection.git
cd apple-disease-detection
```

2. Create and Activate Virtual Environment

```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

3. Install dependencies

```bash
pip install -r requirements.txt
```

4. MySQL Database Setup

- Create a new MySQL database:

```sql
CREATE DATABASE apple_disease_detection;
```

5. Create Database Tables

```bash
mysql -u your_username -p apple_disease_detection < api/database_schema.sql
```

## Running the Project

### Development Server

```bash
# Run Flask backend
python api/auth.py
```

### Production-like Setup

```bash
# Install Gunicorn
pip install gunicorn

# Run with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 api.auth:app
```

## Admin Functionality

- During signup, check the "Register as Admin" checkbox to create an admin account
- Admins can:
  - Access the admin dashboard
  - View all registered users
  - Manage system access

## Security Notes

- Passwords are hashed using Werkzeug
- Admin access is controlled through a dedicated flag
- Basic input validation implemented
- HTTPS recommended for production
- Keep `.env` file private
- Use strong, unique `SECRET_KEY`
- Never commit sensitive information to version control

## Troubleshooting

- Ensure MySQL is running
- Check database connection parameters
- Verify Python and pip versions

## Future Improvements

- Implement more granular role-based access
- Add password reset functionality
- Enhance user management features
- Implement comprehensive logging
