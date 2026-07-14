# config.py
from dotenv import load_dotenv
import os

load_dotenv()

# AWS RDS Config
RDS_HOST = os.getenv("RDS_HOST")
RDS_PORT = int(os.getenv("RDS_PORT", 3306)) 
RDS_USER = os.getenv("RDS_USER")
RDS_PASSWORD = os.getenv("RDS_PASSWORD")
DATABASE_NAME = os.getenv("DATABASE_NAME")
DB_URL = os.getenv("DB_URL")

# JWT Config
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

