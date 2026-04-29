from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Hotel System API"
    
   
    DB_HOST: str = "localhost"
    DB_NAME: str = "postgres"
    DB_USER: str = "postgres"
    DB_PASS: str = ""
    DB_PORT: str = "5432"

    
    SECRET_KEY: str = "supersecretkey123"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

settings = Settings()