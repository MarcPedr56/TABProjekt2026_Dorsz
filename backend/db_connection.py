# --- defines a method used to fetch a database connection object
import os
import psycopg2

def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASS"),
            port=os.getenv("DB_PORT"),
            sslmode="require"
        )
        return conn
    except Exception as e:
        print(f"Błąd połączenia z bazą: {e}")
        return None