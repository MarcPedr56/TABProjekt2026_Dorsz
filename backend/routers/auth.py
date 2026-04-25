from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from psycopg2.extras import RealDictCursor
from database import get_db
from core.security import verify_password, get_password_hash, create_access_token
import schemas

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_guest(data: schemas.RegisterRequest, conn = Depends(get_db)):
    """Rejestruje nowego gościa: najpierw tabela Guest, potem Account."""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        user_in = data.user_in
        guest_in = data.guest_in
        cur.execute("SELECT account_id FROM Account WHERE email = %s", (user_in.email,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Konto z tym emailem już istnieje.")

        cur.execute("""
            INSERT INTO Guest (first_name, last_name, pesel, phone_number, preferences)
            VALUES (%s, %s, %s, %s, %s) RETURNING guest_id;
        """, (guest_in.first_name, guest_in.last_name, guest_in.pesel, guest_in.phone_number, guest_in.preferences))
        new_guest_id = cur.fetchone()['guest_id']

        hashed_pw = get_password_hash(user_in.password)
        cur.execute("""
            INSERT INTO Account (email, password_hash, role_id, guest_id)
            VALUES (%s, %s, (SELECT role_id FROM Role WHERE name='guest'), %s) RETURNING account_id;
        """, (user_in.email, hashed_pw, new_guest_id))
        

        conn.commit()
        return {"message": "Rejestracja zakończona sukcesem. Możesz się zalogować."}
    except Exception as e:
        conn.rollback()
        print(f"Błąd rejestracji: {e}")
        raise HTTPException(status_code=500, detail="Wewnętrzny błąd bazy danych przy rejestracji.")
    finally:
        cur.close()


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), conn = Depends(get_db)):
    """Weryfikuje poświadczenia i zwraca token JWT."""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT a.account_id, a.email, a.password_hash, r.name as role_name 
            FROM Account a
            JOIN Role r ON a.role_id = r.role_id
            WHERE a.email = %s AND a.is_active = TRUE;
        """, (form_data.username,))
        
        user = cur.fetchone()
        
        if not user or not verify_password(form_data.password, user['password_hash']):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Nieprawidłowy email lub hasło",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token = create_access_token(
            data={"sub": user["email"], "role": user["role_name"], "id": user["account_id"]}
        )
        
        return {"access_token": access_token, "token_type": "bearer", "role": user["role_name"]}
    finally:
        cur.close()