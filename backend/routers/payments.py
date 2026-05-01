from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import FileResponse
from psycopg2.extras import RealDictCursor
from fpdf import FPDF
from database import get_db
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
def generate_invoice_pdf(id: int, conn = Depends(get_db)):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT 
                p.payment_id, p.amount, p.invoice_number, p.payment_date,
                g.first_name, g.last_name, g.pesel,
                r.start_date, r.end_date,
                rm.room_number, rm.room_type
            FROM Payment p
            JOIN Reservation r ON p.reservation_id = r.reservation_id
            JOIN Guest g ON r.main_guest_id = g.guest_id
            JOIN Room_reservation rr ON r.reservation_id = rr.reservation_id
            JOIN Room rm ON rr.room_id = rm.room_id
            WHERE p.payment_id = %s
        """, (id,))
        data = cur.fetchone()
        
        if not data:
            raise HTTPException(status_code=404, detail="Płatność nie istnieje")

        cur.execute("""
            SELECT s.name, su.quantity, su.actual_price
            FROM Service_Usage su
            JOIN Service s ON su.service_id = s.service_id
            WHERE su.reservation_id = (SELECT reservation_id FROM Payment WHERE payment_id = %s)
        """, (id,))
        services = cur.fetchall()

        pdf = FPDF()
        pdf.add_page()
        
        pdf.set_font("helvetica", "B", 16)
        
        pdf.cell(0, 10, strip_accents(f"FAKTURA NR: {data['invoice_number']}"), ln=1, align="C")
        pdf.set_font("helvetica", "", 10)
        pdf.cell(0, 10, strip_accents(f"Data wystawienia: {data['payment_date']}"), ln=1, align="R")
        pdf.ln(10) 

        pdf.set_font("helvetica", "B", 12)
        pdf.cell(95, 10, "Sprzedawca:", ln=0, align="L")
        pdf.cell(95, 10, "Nabywca:", ln=1, align="R")
        
        pdf.set_font("helvetica", "", 10)
        pdf.cell(95, 6, "Hotel Bursztyn", ln=0, align="L")
        pdf.cell(95, 6, strip_accents(f"{data['first_name']} {data['last_name']}"), ln=1, align="R")
        pdf.cell(95, 6, "ul. Wakacyjna 12, 80-000 Gdansk", ln=0, align="L")
        pdf.cell(95, 6, f"PESEL: {data['pesel']}", ln=1, align="R")
        pdf.ln(15)

        pdf.set_font("helvetica", "B", 10)
        pdf.cell(80, 10, "Usluga", border=1, ln=0)
        pdf.cell(30, 10, "Ilosc", border=1, ln=0, align="C")
        pdf.cell(40, 10, "Cena Jedn.", border=1, ln=0, align="R")
        pdf.cell(40, 10, "Razem", border=1, ln=1, align="R")

        pdf.set_font("helvetica", "", 10)
        pdf.cell(80, 10, strip_accents(f"Pokoj {data['room_number']} ({data['room_type']})"), border=1, ln=0)
        pdf.cell(30, 10, "1", border=1, ln=0, align="C")
        pdf.cell(40, 10, "-", border=1, ln=0, align="R") 
        pdf.cell(40, 10, f"{data['amount']} PLN", border=1, ln=1, align="R")

        for s in services:
            pdf.cell(80, 10, strip_accents(s['name']), border=1, ln=0)
            pdf.cell(30, 10, str(s['quantity']), border=1, ln=0, align="C")
            pdf.cell(40, 10, f"{s['actual_price'] / s['quantity']:.2f} PLN", border=1, ln=0, align="R")
            pdf.cell(40, 10, f"{s['actual_price']} PLN", border=1, ln=1, align="R")

        total_amount = float(data['amount']) + sum(float(s['actual_price']) for s in services)

        pdf.ln(10)
        pdf.set_font("helvetica", "B", 14)
        pdf.cell(0, 10, f"RAZEM DO ZAPLATY: {total_amount:.2f} PLN", ln=1, align="R")

        pdf_bytes = pdf.output(dest='S').encode('latin-1', errors='replace')
        
        headers = {
            "Content-Disposition": f"attachment; filename=faktura_{data['invoice_number']}.pdf"
        }
        return Response(content=pdf_bytes, media_type="application/pdf", headers=headers)
    finally:
        cur.close()