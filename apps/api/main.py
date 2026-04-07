import os
from dotenv import load_dotenv

# Load environment variables BEFORE importing routers/services
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import imports, stats, tracks, splits, artists, profiles, covers, contracts, resources, works, auth
import uvicorn

# Create Database Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Music Royalties API", version="0.1.0")

# CORS Setup
origins = [
    "http://localhost",
    "http://localhost:5173", # Vite default
    "http://127.0.0.1:5173", # Vite alternate
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(imports.router)
app.include_router(stats.router)
app.include_router(tracks.router)
app.include_router(splits.router)
app.include_router(artists.router)
app.include_router(profiles.router)
app.include_router(covers.router)
app.include_router(contracts.router) # Removes duplicate prefix definition if router already has it
app.include_router(works.router)


app.include_router(resources.router)

# Mount Static Files
from fastapi.staticfiles import StaticFiles
import os

# Ensure we use the static directory inside apps/api
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(os.path.join(static_dir, "media"), exist_ok=True)

app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
def read_root():
    return {"message": "Royalties API is running"}
