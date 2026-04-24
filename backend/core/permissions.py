from fastapi import HTTPException, Depends, status

def get_current_user():
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED, 
        detail="Autoryzacja JWT nie jest jeszcze zaimplementowana. Napisz auth.py!"
    )

def require_admin(current_user: dict = Depends(get_current_user)):
    """Wpuszcza tylko administratorów."""
    if current_user.get("role_id") != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Odmowa dostępu. Wymagane uprawnienia administratora."
        )
    return current_user

def require_staff(current_user: dict = Depends(get_current_user)):
    """Wpuszcza administrację i recepcję, blokuje gości."""
    if current_user.get("role_id") not in [1, 2]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Odmowa dostępu. Strefa tylko dla pracowników."
        )
    return current_user