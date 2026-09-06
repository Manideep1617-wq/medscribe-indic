from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import aiosqlite
import json
import random
from app.database import get_db
from app.routers.auth import get_current_doctor

router = APIRouter(prefix="/api/patients", tags=["Patients"])

class PatientCreate(BaseModel):
    name: str
    age: int
    gender: str
    phone: str | None = None
    blood_group: str | None = "Unknown"
    preferred_language: str | None = "Telugu"

class EncounterUpdate(BaseModel):
    raw_transcript: str | None = None
    english_translation: str | None = None
    chief_complaints: list | None = None
    vitals: dict | None = None
    diagnosis: str | None = None
    disease_stage: str | None = None
    prescriptions: list | None = None
    lab_tests: list | None = None
    doctor_additional_notes: str | None = None

@router.get("/")
async def list_patients(search: str = "", current_doctor: dict = Depends(get_current_doctor), db: aiosqlite.Connection = Depends(get_db)):
    """List all patients for the logged-in doctor with per-patient latest diagnosis."""
    # Use correlated subquery scoped to each patient_id
    query = """
    SELECT 
        p.id, p.uhid, p.name, p.age, p.gender, p.phone, p.blood_group, p.preferred_language,
        p.doctor_id, p.created_at,
        COUNT(e.id) as visit_count,
        MAX(e.created_at) as last_visit_date,
        (SELECT e2.diagnosis FROM encounters e2 WHERE e2.patient_id = p.id AND e2.doctor_id = p.doctor_id ORDER BY e2.id DESC LIMIT 1) as latest_diagnosis,
        (SELECT e2.disease_stage FROM encounters e2 WHERE e2.patient_id = p.id AND e2.doctor_id = p.doctor_id ORDER BY e2.id DESC LIMIT 1) as latest_stage
    FROM patients p
    LEFT JOIN encounters e ON e.patient_id = p.id AND e.doctor_id = p.doctor_id
    WHERE p.doctor_id = ?
    """
    params = [current_doctor["id"]]
    
    if search:
        query += " AND (p.name LIKE ? OR p.uhid LIKE ? OR p.phone LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])
        
    query += " GROUP BY p.id ORDER BY p.id DESC"
    
    async with db.execute(query, params) as cursor:
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]

@router.post("/")
async def create_patient(patient_in: PatientCreate, current_doctor: dict = Depends(get_current_doctor), db: aiosqlite.Connection = Depends(get_db)):
    uhid = f"UHID-IND-2026-{random.randint(1000, 9999)}"
    
    async with db.execute(
        "INSERT INTO patients (uhid, name, age, gender, phone, blood_group, preferred_language, doctor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (uhid, patient_in.name, patient_in.age, patient_in.gender, patient_in.phone, patient_in.blood_group, patient_in.preferred_language, current_doctor["id"])
    ) as cursor:
        patient_id = cursor.lastrowid
        await db.commit()

    async with db.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)) as cursor:
        row = await cursor.fetchone()
        return dict(row)

@router.get("/{patient_id}")
async def get_patient_profile_and_timeline(patient_id: int, current_doctor: dict = Depends(get_current_doctor), db: aiosqlite.Connection = Depends(get_db)):
    async with db.execute("SELECT * FROM patients WHERE id = ? AND doctor_id = ?", (patient_id, current_doctor["id"])) as cursor:
        patient = await cursor.fetchone()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        patient_dict = dict(patient)

    async with db.execute(
        "SELECT * FROM encounters WHERE patient_id = ? ORDER BY visit_number ASC",
        (patient_id,)
    ) as cursor:
        encounters = await cursor.fetchall()
        encounters_list = []
        for enc in encounters:
            item = dict(enc)
            for json_field in ["chief_complaints", "vitals", "symptoms_detail", "prescriptions", "lab_tests", "cds_guideline_analysis"]:
                if item.get(json_field) and isinstance(item[json_field], str):
                    try:
                        item[json_field] = json.loads(item[json_field])
                    except Exception:
                        pass
            encounters_list.append(item)

    patient_dict["encounters"] = encounters_list
    return patient_dict

@router.patch("/{patient_id}/encounters/{encounter_id}")
async def update_encounter(
    patient_id: int,
    encounter_id: int,
    update: EncounterUpdate,
    current_doctor: dict = Depends(get_current_doctor),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Allows doctor to edit any field of a finalized encounter (transcript, notes, prescriptions, etc)."""
    async with db.execute(
        "SELECT id FROM encounters WHERE id = ? AND patient_id = ? AND doctor_id = ?",
        (encounter_id, patient_id, current_doctor["id"])
    ) as cursor:
        enc = await cursor.fetchone()
        if not enc:
            raise HTTPException(status_code=404, detail="Encounter not found")

    fields = []
    values = []

    if update.raw_transcript is not None:
        fields.append("raw_transcript = ?")
        values.append(update.raw_transcript)
    if update.english_translation is not None:
        fields.append("english_translation = ?")
        values.append(update.english_translation)
    if update.chief_complaints is not None:
        fields.append("chief_complaints = ?")
        values.append(json.dumps(update.chief_complaints))
    if update.vitals is not None:
        fields.append("vitals = ?")
        values.append(json.dumps(update.vitals))
    if update.diagnosis is not None:
        fields.append("diagnosis = ?")
        values.append(update.diagnosis)
    if update.disease_stage is not None:
        fields.append("disease_stage = ?")
        values.append(update.disease_stage)
    if update.prescriptions is not None:
        fields.append("prescriptions = ?")
        values.append(json.dumps(update.prescriptions))
    if update.lab_tests is not None:
        fields.append("lab_tests = ?")
        values.append(json.dumps(update.lab_tests))
    if update.doctor_additional_notes is not None:
        fields.append("doctor_additional_notes = ?")
        values.append(update.doctor_additional_notes)

    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    values.extend([encounter_id])
    await db.execute(
        f"UPDATE encounters SET {', '.join(fields)} WHERE id = ?",
        values
    )
    await db.commit()

    async with db.execute("SELECT * FROM encounters WHERE id = ?", (encounter_id,)) as cursor:
        updated = await cursor.fetchone()
        item = dict(updated)
        for json_field in ["chief_complaints", "vitals", "symptoms_detail", "prescriptions", "lab_tests", "cds_guideline_analysis"]:
            if item.get(json_field) and isinstance(item[json_field], str):
                try:
                    item[json_field] = json.loads(item[json_field])
                except Exception:
                    pass
        return item
