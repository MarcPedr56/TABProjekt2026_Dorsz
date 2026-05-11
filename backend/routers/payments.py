from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import FileResponse
from psycopg2.extras import RealDictCursor
from fpdf import FPDF
from database import get_db
from datetime import datetime
import os
import schemas

def strip_accents(text):
    if not isinstance(text, str):
        return str(text)
    replacements = {
        'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
        'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
    }
    for search, replace in replacements.items():
        text = text.replace(search, replace)
    return text

router = APIRouter(
    prefix="/payments",
    tags=["Payments"]
)


@router.get("/", response_model=list[schemas.PaymentResponse])
def get_payments(conn = Depends(get_db)):
    """Pobiera listę wszystkich opłat"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT * FROM Payment ORDER BY status, payment_id;")
        payments = cur.fetchall()
        return payments
    except Exception as e:
        print(f"Błąd SQL: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()

@router.post("/", response_model=schemas.PaymentResponse)
def add_payment(payment: schemas.PaymentCreate, conn = Depends(get_db)):
    """Dodaje nową opłatę do bazy i generuje numer faktury"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # 1. Wstawiamy płatność do bazy BEZ numeru faktury, żeby uzyskać z bazy payment_id
        cur.execute("""
            INSERT INTO Payment (reservation_id, amount, method, status, type) 
            VALUES (%s, %s, %s, %s, %s) 
            RETURNING payment_id;
        """, (
            payment.reservation_id,
            payment.amount,
            payment.method,
            payment.status,
            payment.type
        ))
        
        payment_id = cur.fetchone()['payment_id']
        
        now = datetime.now()
        invoice_num = f"FV/{now.year}/{now.strftime('%m')}/{payment_id}"
        
        cur.execute("""
            UPDATE Payment 
            SET invoice_number = %s 
            WHERE payment_id = %s 
            RETURNING payment_id, reservation_id, amount, method, status, type, invoice_number, payment_date;
        """, (invoice_num, payment_id))
        
        new_payment = cur.fetchone()
        conn.commit()
        return new_payment

    except Exception as e:
        conn.rollback()
        print(f"Błąd SQL: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()

@router.get("/pesel/{pesel}", response_model=list[schemas.PaymentResponse])
def get_payments_by_pesel(pesel: str, conn = Depends(get_db)):
    """Wyszukuje płatności powiązane z konkretnym numerem PESEL gościa"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT p.* FROM Payment p
            JOIN Reservation r ON p.reservation_id = r.reservation_id
            JOIN Guest g ON r.main_guest_id = g.guest_id
            WHERE g.pesel = %s
            ORDER BY p.status, p.payment_date DESC;
        """, (pesel,))
        return cur.fetchall()
    except Exception as e:
        print(f"Błąd SQL: {e}")
        raise HTTPException(status_code=500, detail="Błąd bazy danych podczas wyszukiwania")
    finally:
        cur.close()

@router.put("/{id}")
def update_payment(id: int, data: schemas.PaymentUpdate, conn = Depends(get_db)):
    """Zmienia metodę i status płatności o danym id"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # znajdź płatność
        cur.execute("""
            SELECT p.payment_id
            FROM Payment p
            WHERE p.payment_id = %s;
        """, (id,))
    
        payment = cur.fetchone()

        if not payment:
            raise HTTPException(status_code=404, detail="Płatność nie istnieje")
        
        cur.execute("""
            UPDATE Payment as p
            SET method = %s, status = %s
            WHERE p.payment_id = %s;
        """, (
            data.method,
            data.status,
            payment["payment_id"]
        ))

        conn.commit()

    except Exception as e:
        print(f"Błąd SQL: {e}")
        raise HTTPException(status_code=500, detail="Błąd bazy danych podczas wyszukiwania")
    finally:
        cur.close()

@router.get("/{id}/pdf")
def generate_invoice_pdf(id: int, conn=Depends(get_db)):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT 
                p.payment_id, p.amount, p.payment_date, p.invoice_number,
                r.reservation_id, r.start_date, r.end_date,
                g.first_name, g.last_name, g.pesel,
                rm.room_number, rm.room_type,
                rr.actual_price_per_night
            FROM Payment p
            JOIN Reservation r ON p.reservation_id = r.reservation_id
            JOIN Guest g ON r.main_guest_id = g.guest_id
            JOIN Room_Reservation rr ON r.reservation_id = rr.reservation_id
            JOIN Room rm ON rr.room_id = rm.room_id
            WHERE p.payment_id = %s
        """, (id,))
        data = cur.fetchone()

        if not data:
            raise HTTPException(status_code=404, detail="Płatność nie istnieje")

        cur.execute("""
            SELECT s.name, su.quantity, s.price, su.actual_price
            FROM service_usage su
            JOIN Service s ON su.service_id = s.service_id
            WHERE su.reservation_id = %s
        """, (data["reservation_id"],))
        services = cur.fetchall()

        days = (data["end_date"] - data["start_date"]).days
        if days < 1: days = 1
        room_price_total = days * data["actual_price_per_night"]

        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("helvetica", "B", 14)
        
        inv_number = data['invoice_number'] if data['invoice_number'] else f"FV/{data['payment_id']}/{datetime.now().year}"
        pdf.cell(0, 10, f"FAKTURA NR: {inv_number}", ln=1, align="C")
        
        pdf.set_font("helvetica", "", 10)
        formatted_date = data['payment_date'].strftime('%Y-%m-%d %H:%M')
        pdf.cell(0, 10, f"Data wystawienia: {formatted_date}", ln=1)
        
        pdf.ln(5)
        pdf.cell(90, 5, "Sprzedawca:", 0, 0)
        pdf.cell(90, 5, "Nabywca:", 0, 1)
        pdf.set_font("helvetica", "B", 10)
        pdf.cell(90, 5, "Hotel Bursztyn", 0, 0)
        
        guest_name = strip_accents(f"{data['first_name']} {data['last_name']}")
        pdf.cell(90, 5, guest_name, 0, 1)
        
        pdf.set_font("helvetica", "", 10)
        pdf.cell(90, 5, "ul. Wakacyjna 12, 80-000 Gdansk", 0, 0)
        pesel_text = f"PESEL: {data['pesel']}" if data['pesel'] else ""
        pdf.cell(90, 5, pesel_text, 0, 1)

        pdf.ln(10)
        
        # Nagłówki tabeli
        pdf.set_font("helvetica", "B", 10)
        pdf.cell(70, 10, "Usluga", 1)
        pdf.cell(20, 10, "Ilosc", 1, 0, 'C')
        pdf.cell(40, 10, "Cena Jedn.", 1, 0, 'R')
        pdf.cell(40, 10, "Razem", 1, 1, 'R')
        
        pdf.set_font("helvetica", "", 10)
        
        room_desc = strip_accents(f"Pokoj {data['room_number']} ({data['room_type']})")
        pdf.cell(70, 10, room_desc, 1)
        pdf.cell(20, 10, str(days), 1, 0, 'C') # Wyświetlamy ilość nocy
        pdf.cell(40, 10, f"{data['actual_price_per_night']:.2f} PLN", 1, 0, 'R')
        pdf.cell(40, 10, f"{room_price_total:.2f} PLN", 1, 1, 'R')
        
        for s in services:
            s_name = strip_accents(s['name'])
            pdf.cell(70, 10, s_name, 1)
            pdf.cell(20, 10, str(s['quantity']), 1, 0, 'C')
            pdf.cell(40, 10, f"{s['price']:.2f} PLN", 1, 0, 'R')
            pdf.cell(40, 10, f"{s['actual_price']:.2f} PLN", 1, 1, 'R')

        pdf.ln(5)
        pdf.set_font("helvetica", "B", 12)
        
        pdf.cell(0, 10, f"RAZEM DO ZAPLATY: {data['amount']:.2f} PLN", ln=1, align="R")

        pdf_bytes = pdf.output(dest='S').encode('latin-1', errors='replace')
        
        return Response(content=pdf_bytes, media_type="application/pdf", headers={
            "Content-Disposition": f"attachment; filename=faktura_{data['payment_id']}.pdf"
        })
    except Exception as e:
        print("PDF ERROR:", e)
        raise HTTPException(status_code=500, detail="Błąd generowania faktury")
    finally:
        cur.close()

@router.get("/user/{email}")
def get_user_payments(email: str, conn = Depends(get_db)):
    """Pobiera płatności zalogowanego usera i przy okazji łata brakujące numery faktur"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # Najpierw wygeneruj numery faktur dla tych, co ich nie mają (np. FV/ID/ROK)
        cur.execute("""
            UPDATE Payment 
            SET invoice_number = 'FV/' || payment_id || '/' || TO_CHAR(payment_date, 'YYYY')
            WHERE invoice_number IS NULL;
        """)
        
        # Pobierz płatności
        cur.execute("""
            SELECT p.*
            FROM Payment p
            JOIN Reservation r ON p.reservation_id = r.reservation_id
            JOIN Guest g ON r.main_guest_id = g.guest_id
            JOIN Account a ON g.guest_id = a.guest_id
            WHERE a.email = %s
            ORDER BY p.payment_date DESC;
        """, (email,))
        return cur.fetchall()
    finally:
        cur.close()