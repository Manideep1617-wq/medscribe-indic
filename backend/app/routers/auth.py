from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from jose import JWTError, jwt
from datetime import datetime, timedelta
import aiosqlite
import hashlib
import os
import secrets
from app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.database import get_db

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

class DoctorRegister(BaseModel):
    name: str
    email: str
    password: str
    department: str
    hospital_name: str

class DoctorResponse(BaseModel):
    id: int
    name: str
    email: str
    department: str
    hospital_name: str

class Token(BaseModel):
    access_token: str
    token_type: str
    doctor: DoctorResponse

def get_password_hash(password: str) -> str:
    """Standard PBKDF2 SHA256 password hash (robust, dependency-free)."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return f"{salt}${key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies password hash against plain text."""
    try:
        if "$" not in hashed_password:
            # Fallback legacy or plain match
            return plain_password == hashed_password
        salt, key_hex = hashed_password.split("$", 1)
        new_key = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return secrets.compare_digest(new_key.hex(), key_hex)
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_doctor(token: str = Depends(oauth2_scheme), db: aiosqlite.Connection = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    async with db.execute("SELECT id, name, email, department, hospital_name FROM doctors WHERE email = ?", (email,)) as cursor:
        doctor = await cursor.fetchone()
        if doctor is None:
            raise credentials_exception
        return dict(doctor)

@router.post("/register", response_model=Token)
async def register(doctor_in: DoctorRegister, db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("SELECT id FROM doctors WHERE email = ?", (doctor_in.email,)) as cursor:
        existing = await cursor.fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Doctor with this email already registered.")

    hashed_pw = get_password_hash(doctor_in.password)
    async with db.execute(
        "INSERT INTO doctors (name, email, password_hash, department, hospital_name) VALUES (?, ?, ?, ?, ?)",
        (doctor_in.name, doctor_in.email, hashed_pw, doctor_in.department, doctor_in.hospital_name)
    ) as cursor:
        doctor_id = cursor.lastrowid
        await db.commit()

    token = create_access_token({"sub": doctor_in.email, "doctor_id": doctor_id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "doctor": {
            "id": doctor_id,
            "name": doctor_in.name,
            "email": doctor_in.email,
            "department": doctor_in.department,
            "hospital_name": doctor_in.hospital_name
        }
    }

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("SELECT id, name, email, password_hash, department, hospital_name FROM doctors WHERE email = ?", (form_data.username,)) as cursor:
        doctor = await cursor.fetchone()
        if not doctor or not verify_password(form_data.password, doctor["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        token = create_access_token({"sub": doctor["email"], "doctor_id": doctor["id"]})
        return {
            "access_token": token,
            "token_type": "bearer",
            "doctor": {
                "id": doctor["id"],
                "name": doctor["name"],
                "email": doctor["email"],
                "department": doctor["department"],
                "hospital_name": doctor["hospital_name"]
            }
        }

@router.get("/me", response_model=DoctorResponse)
async def read_current_doctor(current_doctor: dict = Depends(get_current_doctor)):
    return current_doctor
