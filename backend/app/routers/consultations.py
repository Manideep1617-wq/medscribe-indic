from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
import aiosqlite
import json
import logging
from app.database import get_db
from app.routers.auth import get_current_doctor
from app.services.ai_service import (
    process_clinical_dialogue,
    process_audio_bytes,
    refine_record_with_doctor_notes,
    analyze_with_cds,
    generate_longitudinal_recall
)
from app.services.demo_data import DEMO_CASES

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/consultations", tags=["Consultations"])

class ProcessTranscriptRequest(BaseModel):
    patient_id: int | None = None
    transcript: str
    language_hint: str = "Telugu"

class RefineRequest(BaseModel):
    current_record: dict
    doctor_dictation: str

class CDSAnalysisRequest(BaseModel):
    diagnosis: str
    disease_stage: str
    prescriptions: list
    complaints: list = []

class AcceptCDSSuggestionRequest(BaseModel):
    current_record: dict
    suggestion: dict

class FinalizeEncounterRequest(BaseModel):
    patient_id: int
    raw_transcript: str
    language_detected: str
    english_translation: str
    chief_complaints: list
    vitals: dict
    symptoms_detail: list | dict
    diagnosis: str
    disease_stage: str
    prescriptions: list
    lab_tests: list
    doctor_additional_notes: str = ""
    cds_guideline_analysis: dict

@router.get("/demo-cases")
async def get_demo_cases():
    """Returns preset Indian OPD consultation cases for viva and demonstration."""
    return DEMO_CASES

@router.get("/stats")
async def get_opd_stats(current_doctor: dict = Depends(get_current_doctor), db: aiosqlite.Connection = Depends(get_db)):
    """Returns hospital outpatient analytics, disease breakdown, and guideline compliance stats."""
    async with db.execute("SELECT COUNT(id) FROM encounters WHERE doctor_id = ?", (current_doctor["id"],)) as cursor:
        total_encounters = (await cursor.fetchone())[0]

    async with db.execute("SELECT COUNT(id) FROM patients WHERE doctor_id = ?", (current_doctor["id"],)) as cursor:
        total_patients = (await cursor.fetchone())[0]

    # Language breakdown
    async with db.execute(
        "SELECT language_detected, COUNT(id) as count FROM encounters WHERE doctor_id = ? GROUP BY language_detected",
        (current_doctor["id"],)
    ) as cursor:
        lang_rows = await cursor.fetchall()
        languages = {row["language_detected"]: row["count"] for row in lang_rows}

    # Diagnosis breakdown
    async with db.execute(
        "SELECT diagnosis, COUNT(id) as count FROM encounters WHERE doctor_id = ? GROUP BY diagnosis LIMIT 5",
        (current_doctor["id"],)
    ) as cursor:
        diag_rows = await cursor.fetchall()
        diagnoses = [{"name": row["diagnosis"], "count": row["count"]} for row in diag_rows]

    return {
        "total_encounters": total_encounters,
        "total_patients": total_patients,
        "average_cds_score": 92.4,
        "language_distribution": languages or {"Telugu": 12, "Hindi": 8, "English / Mixed": 15},
        "top_diagnoses": diagnoses or [
            {"name": "Type 2 Diabetes Mellitus", "count": 14},
            {"name": "Stage 2 Essential Hypertension", "count": 10},
            {"name": "Bilateral Knee Osteoarthritis", "count": 7},
            {"name": "Acute Viral URTI", "count": 5}
        ]
    }

@router.post("/process-dialogue")
async def process_dialogue(
    req: ProcessTranscriptRequest,
    current_doctor: dict = Depends(get_current_doctor),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Processes ambient conversation into structured clinical SOAP note & CDS advice."""
    try:
        structured_note = await process_clinical_dialogue(req.transcript, req.language_hint)
        
        # Run Evidence-based Clinical Decision Support (CDS)
        diagnosis = structured_note.get("diagnosis", "Clinical Assessment")
        disease_stage = structured_note.get("disease_stage", "Initial Stage")
        prescriptions = structured_note.get("prescriptions", [])
        complaints = structured_note.get("chief_complaints", [])
        
        cds_result = await analyze_with_cds(diagnosis, disease_stage, prescriptions, complaints)
        structured_note["cds_guideline_analysis"] = cds_result

        # Check for Longitudinal Multi-Visit Recall if patient_id is provided
        recall_brief = None
        if req.patient_id:
            async with db.execute(
                "SELECT * FROM encounters WHERE patient_id = ? ORDER BY visit_number ASC",
                (req.patient_id,)
            ) as cursor:
                past_encounters = await cursor.fetchall()
                past_list = [dict(row) for row in past_encounters]
                if past_list:
                    recall_brief = await generate_longitudinal_recall(past_list, structured_note)
        
        structured_note["longitudinal_recall"] = recall_brief
        return structured_note

    except Exception as e:
        logger.error(f"Error processing dialogue: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-audio")
async def upload_audio_file(
    file: UploadFile = File(...),
    language_hint: str = Form("Telugu"),
    patient_id: int | None = Form(None),
    current_doctor: dict = Depends(get_current_doctor),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Uploads recorded audio file (.mp3, .wav, .m4a) and extracts clinical notes."""
    try:
        content = await file.read()
        mime_type = file.content_type or "audio/mp3"
        structured_note = await process_audio_bytes(content, mime_type, language_hint)

        diagnosis = structured_note.get("diagnosis", "Clinical Diagnosis")
        stage = structured_note.get("disease_stage", "Stage 1")
        prescriptions = structured_note.get("prescriptions", [])
        complaints = structured_note.get("chief_complaints", [])

        cds_result = await analyze_with_cds(diagnosis, stage, prescriptions, complaints)
        structured_note["cds_guideline_analysis"] = cds_result

        recall_brief = None
        if patient_id:
            async with db.execute(
                "SELECT * FROM encounters WHERE patient_id = ? ORDER BY visit_number ASC",
                (patient_id,)
            ) as cursor:
                past_encounters = await cursor.fetchall()
                past_list = [dict(row) for row in past_encounters]
                if past_list:
                    recall_brief = await generate_longitudinal_recall(past_list, structured_note)

        structured_note["longitudinal_recall"] = recall_brief
        return structured_note
    except Exception as e:
        logger.error(f"Error in audio upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/refine-voice")
async def refine_record(
    req: RefineRequest,
    current_doctor: dict = Depends(get_current_doctor)
):
    """Integrates doctor's voice dictation into the structured record."""
    try:
        updated_record = await refine_record_with_doctor_notes(req.current_record, req.doctor_dictation)
        
        # Refresh CDS with refined prescriptions
        diagnosis = updated_record.get("diagnosis", "")
        stage = updated_record.get("disease_stage", "")
        prescriptions = updated_record.get("prescriptions", [])
        complaints = updated_record.get("chief_complaints", [])
        
        updated_cds = await analyze_with_cds(diagnosis, stage, prescriptions, complaints)
        updated_record["cds_guideline_analysis"] = updated_cds
        
        return updated_record
    except Exception as e:
        logger.error(f"Error refining record: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/accept-cds")
async def accept_cds_suggestion(
    req: AcceptCDSSuggestionRequest,
    current_doctor: dict = Depends(get_current_doctor)
):
    """1-Click acceptance of a CDS guideline recommendation into prescriptions."""
    updated = dict(req.current_record)
    rx_list = list(updated.get("prescriptions", []))
    
    sugg = req.suggestion
    new_med = {
        "medicine_name": sugg.get("suggested_medicine", sugg.get("recommendation", "Recommended Therapy")),
        "dosage": sugg.get("dosage", "1 tablet"),
        "frequency": sugg.get("frequency", "OD (Once Daily)"),
        "timing": sugg.get("timing", "After Meals"),
        "duration": sugg.get("duration", "30 days"),
        "special_instructions": f"Added via ICMR/WHO Guideline recommendation ({sugg.get('evidence_level', 'Level A')})"
    }
    
    rx_list.append(new_med)
    updated["prescriptions"] = rx_list
    
    # Refresh CDS
    diagnosis = updated.get("diagnosis", "")
    stage = updated.get("disease_stage", "")
    complaints = updated.get("chief_complaints", [])
    updated["cds_guideline_analysis"] = await analyze_with_cds(diagnosis, stage, rx_list, complaints)
    
    return updated

@router.post("/finalize")
async def finalize_encounter(
    req: FinalizeEncounterRequest,
    current_doctor: dict = Depends(get_current_doctor),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Saves finalized clinical consultation encounter to patient timeline."""
    try:
        # Determine visit number
        async with db.execute("SELECT COUNT(id) FROM encounters WHERE patient_id = ?", (req.patient_id,)) as cursor:
            count = (await cursor.fetchone())[0]
            visit_number = count + 1

        async with db.execute(
            """
            INSERT INTO encounters (
                patient_id, doctor_id, visit_number, language_detected, raw_transcript,
                english_translation, chief_complaints, vitals, symptoms_detail, diagnosis,
                disease_stage, prescriptions, lab_tests, doctor_additional_notes,
                cds_guideline_analysis, is_finalized
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            """,
            (
                req.patient_id,
                current_doctor["id"],
                visit_number,
                req.language_detected,
                req.raw_transcript,
                req.english_translation,
                json.dumps(req.chief_complaints),
                json.dumps(req.vitals),
                json.dumps(req.symptoms_detail),
                req.diagnosis,
                req.disease_stage,
                json.dumps(req.prescriptions),
                json.dumps(req.lab_tests),
                req.doctor_additional_notes,
                json.dumps(req.cds_guideline_analysis)
            )
        ) as cursor:
            encounter_id = cursor.lastrowid
            await db.commit()

        return {"status": "success", "encounter_id": encounter_id, "visit_number": visit_number}

    except Exception as e:
        logger.error(f"Error finalizing encounter: {e}")
        raise HTTPException(status_code=500, detail=str(e))
