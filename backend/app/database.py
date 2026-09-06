import aiosqlite
import json
import os
from app.config import DB_PATH

async def get_db():
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        yield db
    finally:
        await db.close()

async def init_db():
    from app.routers.auth import get_password_hash
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("PRAGMA foreign_keys = ON;")
        
        # Doctors table
        await db.execute("""
        CREATE TABLE IF NOT EXISTS doctors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            department TEXT NOT NULL,
            hospital_name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Patients table
        await db.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uhid TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            age INTEGER NOT NULL,
            gender TEXT NOT NULL,
            phone TEXT,
            blood_group TEXT,
            preferred_language TEXT DEFAULT 'Telugu',
            doctor_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (doctor_id) REFERENCES doctors(id)
        );
        """)

        # Clinical Encounters / Visits table
        await db.execute("""
        CREATE TABLE IF NOT EXISTS encounters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER NOT NULL,
            doctor_id INTEGER NOT NULL,
            visit_number INTEGER DEFAULT 1,
            language_detected TEXT DEFAULT 'English',
            raw_transcript TEXT NOT NULL,
            english_translation TEXT,
            chief_complaints TEXT,        -- JSON array
            vitals TEXT,                  -- JSON object
            symptoms_detail TEXT,         -- JSON object with duration, severity
            diagnosis TEXT,
            disease_stage TEXT,
            prescriptions TEXT,           -- JSON array of {medicine, dosage, timing, duration, notes}
            lab_tests TEXT,               -- JSON array
            doctor_additional_notes TEXT,
            cds_guideline_analysis TEXT,  -- JSON object with efficiency score, alerts, recommended approach
            is_finalized INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id),
            FOREIGN KEY (doctor_id) REFERENCES doctors(id)
        );
        """)
        
        # Seed or refresh default demo doctor account
        hashed_pw = get_password_hash("password123")
        async with db.execute("SELECT id FROM doctors WHERE email = ?", ("doctor@aiims.edu.in",)) as cursor:
            existing = await cursor.fetchone()
            if not existing:
                await db.execute(
                    """
                    INSERT INTO doctors (name, email, password_hash, department, hospital_name)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    ("Dr. Aarav Sharma, MD (AIIMS)", "doctor@aiims.edu.in", hashed_pw, "General Medicine & Diabetology", "AIIMS Hospital & Research Center")
                )
            else:
                await db.execute(
                    "UPDATE doctors SET password_hash = ? WHERE email = ?",
                    (hashed_pw, "doctor@aiims.edu.in")
                )
        
        await db.commit()
