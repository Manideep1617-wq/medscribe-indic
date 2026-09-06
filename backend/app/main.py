from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.database import init_db
from app.routers import auth, patients, consultations

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("medscribe-indic")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing MedScribe Indic SQLite Database & Seeding...")
    await init_db()
    yield
    logger.info("Shutting down MedScribe Indic backend.")

app = FastAPI(
    title="MedScribe Indic API",
    description="Multilingual Ambient Clinical Intelligence & CDS System for Indian Healthcare (Telugu, Hindi, English)",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(consultations.router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "MedScribe Indic AI Clinical Assistant",
        "supported_languages": ["Telugu", "Hindi", "English", "Tenglish", "Hinglish"],
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
