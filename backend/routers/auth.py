from __future__ import annotations

import hashlib
import os
import secrets

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from auth import create_access_token, get_current_user, hash_password, verify_password
from database import get_db
from email_service import send_password_reset_email
from models import PasswordResetToken, User
from schemas import ForgotPasswordRequest, ResetPasswordRequest, Token, UserCreate, UserPublic

# Production cookie settings — read from env so they adapt to HTTPS vs HTTP
_COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
_COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax").lower()  # "lax" or "none"

_FRONTEND_URL = os.getenv("FRONTEND_URL", "https://stress-level-project.vercel.app")
_GENERIC_MSG = "Eğer bu e-posta adresi sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderildi."

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


from fastapi import Response

@router.post("/login", response_model=Token)
def login(response: Response, form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(subject=user.email)
    response.set_cookie(
        key="access_token",
        value=f"Bearer {token}",
        httponly=True,
        secure=_COOKIE_SECURE,
        samesite=_COOKIE_SAMESITE,
        max_age=24 * 60 * 60,
        path="/"
    )
    return Token(access_token=token)

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token", httponly=True, secure=_COOKIE_SECURE, samesite=_COOKIE_SAMESITE, path="/")
    return {"ok": True}

@router.get("/me", response_model=UserPublic)
def me(current_user: User = Depends(get_current_user)):
    return current_user


# ── Password Reset ──────────────────────────────────────────────────────────

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Always returns a generic message so we don't reveal whether the e-mail exists.
    """
    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        expires_at = datetime.utcnow() + timedelta(minutes=30)

        reset_token = PasswordResetToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        db.add(reset_token)
        db.commit()

        reset_link = f"{_FRONTEND_URL}/reset-password?token={raw_token}"
        send_password_reset_email(user.email, reset_link)

    return {"message": _GENERIC_MSG}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(payload.token.encode()).hexdigest()

    record = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.token_hash == token_hash)
        .first()
    )

    if not record:
        raise HTTPException(status_code=400, detail="Geçersiz veya süresi dolmuş bağlantı.")

    if record.used_at is not None:
        raise HTTPException(status_code=400, detail="Bu şifre sıfırlama bağlantısı zaten kullanıldı.")

    if datetime.utcnow() > record.expires_at:
        raise HTTPException(status_code=400, detail="Şifre sıfırlama bağlantısının süresi doldu. Lütfen yeni bir talepte bulunun.")

    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="Geçersiz veya süresi dolmuş bağlantı.")

    user.password_hash = hash_password(payload.new_password)
    record.used_at = datetime.utcnow()
    db.commit()

    return {"message": "Şifreniz başarıyla güncellendi. Şimdi giriş yapabilirsiniz."}

