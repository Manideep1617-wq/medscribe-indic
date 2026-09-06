import asyncio
import json
from app.main import app
from app.database import init_db
import httpx

async def run_tests():
    print("--- 1. Initializing Database ---")
    await init_db()
    
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        
        # 1. Test Root
        root_res = await client.get("/")
        print("Root Status:", root_res.status_code, root_res.json())
        assert root_res.status_code == 200

        # 2. Test Doctor Login
        login_res = await client.post(
            "/api/auth/token",
            data={"username": "doctor@aiims.edu.in", "password": "password123"}
        )
        print("Login Status:", login_res.status_code)
        assert login_res.status_code == 200
        token_data = login_res.json()
        token = token_data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Logged in as:", token_data["doctor"]["name"])

        # 3. Test Create Patient
        patient_res = await client.post(
            "/api/patients/",
            headers=headers,
            json={
                "name": "K. Venkateswara Rao",
                "age": 54,
                "gender": "Male",
                "phone": "9876543210",
                "blood_group": "B+",
                "preferred_language": "Telugu"
            }
        )
        print("Create Patient Status:", patient_res.status_code)
        assert patient_res.status_code == 200
        patient = patient_res.json()
        patient_id = patient["id"]
        print(f"Created Patient: {patient['name']} (ID: {patient_id}, UHID: {patient['uhid']})")

        # 4. Test Process Telugu Clinical Dialogue
        telugu_transcript = """డాక్టర్: నమస్కారం వెంకటేశ్వరరావు గారు, కూర్చోండి. ఈ మధ్య ఆరోగ్యం ఎలా ఉంది?
పేషెంట్: నమస్కారం డాక్టర్ గారు. కాళ్లలో విపరీతమైన తిమ్మిర్లు వస్తున్నాయి, రాత్రి పూట 4 సార్లు మూత్రం వస్తుంది.
డాక్టర్: షుగర్ లెవెల్స్ చూద్దాం... BP 140/90 ఉంది. ఇది డయాబెటిక్ న్యూరోపతి లక్షణం. మెట్‌ఫార్మిన్ 1000mg రాస్తున్నాను."""
        
        process_res = await client.post(
            "/api/consultations/process-dialogue",
            headers=headers,
            json={
                "patient_id": patient_id,
                "transcript": telugu_transcript,
                "language_hint": "Telugu"
            }
        )
        print("Process Dialogue Status:", process_res.status_code)
        assert process_res.status_code == 200
        structured_note = process_res.json()
        print("Extracted Diagnosis:", structured_note.get("diagnosis"))
        print("Disease Stage:", structured_note.get("disease_stage"))
        print("Prescriptions Extracted:", len(structured_note.get("prescriptions", [])))
        print("CDS Efficacy Score:", structured_note.get("cds_guideline_analysis", {}).get("efficiency_score"))

        # 5. Test Doctor Voice Dictation Refinement
        refine_res = await client.post(
            "/api/consultations/refine-voice",
            headers=headers,
            json={
                "current_record": structured_note,
                "doctor_dictation": "Also add Tab Telmisartan 40mg once daily in the morning for blood pressure control and order HbA1c test."
            }
        )
        print("Voice Refine Status:", refine_res.status_code)
        assert refine_res.status_code == 200
        refined_note = refine_res.json()
        print("Refinement Updated Notes:", bool(refined_note.get("doctor_additional_notes") or refined_note.get("prescriptions")))

        # 6. Test Finalize Encounter #1
        finalize_res = await client.post(
            "/api/consultations/finalize",
            headers=headers,
            json={
                "patient_id": patient_id,
                "raw_transcript": telugu_transcript,
                "language_detected": "Telugu",
                "english_translation": refined_note.get("english_translation", ""),
                "chief_complaints": refined_note.get("chief_complaints", []),
                "vitals": refined_note.get("vitals", {}),
                "symptoms_detail": refined_note.get("symptoms_analysis", []),
                "diagnosis": refined_note.get("diagnosis", "Type 2 Diabetes Mellitus"),
                "disease_stage": refined_note.get("disease_stage", "Stage 2"),
                "prescriptions": refined_note.get("prescriptions", []),
                "lab_tests": refined_note.get("recommended_tests", []),
                "doctor_additional_notes": refined_note.get("doctor_additional_notes", ""),
                "cds_guideline_analysis": refined_note.get("cds_guideline_analysis", {})
            }
        )
        print("Finalize Encounter #1 Status:", finalize_res.status_code, finalize_res.json())
        assert finalize_res.status_code == 200

        # 7. Test Follow-up Visit #2 with Longitudinal Recall Check
        followup_transcript = """డాక్టర్: వెంకటేశ్వరరావు గారు, గత నెల మందులు వాడిన తర్వాత ఎలా ఉంది?
పేషెంట్: తిమ్మిర్లు కొంచెం తగ్గాయి డాక్టర్, కానీ ఈ మధ్య అప్పుడప్పుడు కళ్ళు తిరుగుతున్నాయి."""
        
        followup_res = await client.post(
            "/api/consultations/process-dialogue",
            headers=headers,
            json={
                "patient_id": patient_id,
                "transcript": followup_transcript,
                "language_hint": "Telugu"
            }
        )
        print("Followup Visit #2 Status:", followup_res.status_code)
        assert followup_res.status_code == 200
        followup_note = followup_res.json()
        print("Longitudinal Recall Generated:", bool(followup_note.get("longitudinal_recall")))
        if followup_note.get("longitudinal_recall"):
            print("Recall Summary:", followup_note["longitudinal_recall"].get("brief_summary"))

        # 9. Test Edit Encounter (Doctor correction)
        encounter_id = finalize_res.json()["encounter_id"]
        update_res = await client.patch(
            f"/api/patients/{patient_id}/encounters/{encounter_id}",
            headers=headers,
            json={
                "diagnosis": "Type 2 Diabetes Mellitus with Distal Polyneuropathy (Corrected)",
                "doctor_additional_notes": "Advised daily foot inspection and strict glycemic log."
            }
        )
        print("Update Encounter Status:", update_res.status_code)
        assert update_res.status_code == 200
        updated_enc = update_res.json()
        assert "Corrected" in updated_enc["diagnosis"]
        print("Updated Diagnosis verified:", updated_enc["diagnosis"])

        # 10. Test List Patients - Distinct latest diagnosis check
        list_res = await client.get("/api/patients/", headers=headers)
        assert list_res.status_code == 200
        patients_list = list_res.json()
        target_p = next((p for p in patients_list if p["id"] == patient_id), None)
        assert target_p is not None
        assert "Corrected" in target_p["latest_diagnosis"]
        print(f"Verified Patient List has correct individual diagnosis: {target_p['latest_diagnosis']}")

    print("\n[SUCCESS] ALL END-TO-END CLINICAL API WORKFLOW TESTS PASSED (INCLUDING ENCOUNTER EDIT)!")

if __name__ == "__main__":
    asyncio.run(run_tests())
