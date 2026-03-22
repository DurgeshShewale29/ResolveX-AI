from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import datetime
import numpy as np
from sentence_transformers import SentenceTransformer

app = FastAPI(title="ResolveX AI Engine")

app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"], 
    allow_methods=["*"], 
    allow_headers=["*"],
)

print("Loading AI Embedding Model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("AI Model Loaded Successfully! 🚀")

# --- MONGODB MOCK (Global list so it can "Learn" during the demo) ---
historical_tickets = [
    {
        "id": "HIST-001",
        "error_text": "OperationalError: FATAL: remaining connection slots are reserved for non-replication superuser connections",
        "root_cause": "The application is hitting the max_connections limit configured in postgresql.conf.",
        "resolution": "Execute script: increase max_connections from 100 to 200 and gracefully restart the postgresql-14 service.",
        "time_saved": "45 minutes"
    }
]

# Pre-compute vectors
for ticket in historical_tickets:
    ticket['embedding'] = model.encode(ticket['error_text'])

# --- SCHEMAS ---
class Incident(BaseModel):
    id: str
    title: str
    error_log: str
    status: str
    severity: str
    timestamp: str

class AIAnalysisRequest(BaseModel):
    error_log: str

class OverrideRequest(BaseModel):
    error_log: str
    new_resolution: str

# --- API ENDPOINTS ---
@app.get("/api/incidents", response_model=List[Incident])
def get_incidents():
    return [
        {
            "id": "INC-101",
            "title": "Database Connection Timeout - Cluster A",
            "error_log": "OperationalError: FATAL: remaining connection slots are reserved for non-replication superuser connections",
            "status": "Pending",
            "severity": "Critical",
            "timestamp": datetime.datetime.now().isoformat()
        },
        {
            "id": "PRED-204",
            "title": "[Predictive Warning] High Disk I/O Queue",
            "error_log": "DiskQueueLength > 50 for 5 minutes on DB-Node-02. Predictive model indicates 85% chance of crash within 1 hour.",
            "status": "Warning",
            "severity": "Warning",
            "timestamp": datetime.datetime.now().isoformat()
        }
    ]

def cosine_similarity(v1, v2):
    return np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))

@app.post("/api/analyze")
def analyze_incident(request: AIAnalysisRequest):
    query_vector = model.encode(request.error_log)
    best_match = None
    highest_score = -1

    for ticket in historical_tickets:
        score = cosine_similarity(query_vector, ticket['embedding'])
        if score > highest_score:
            highest_score = score
            best_match = ticket

    if highest_score < 0.5:
        return {
            "rootCause": "Anomaly detected. No high-confidence historical match found in Vector DB.",
            "confidence": f"{round(highest_score * 100, 1)}%",
            "recommendedAction": "Requires Human L2 Escalation and manual override.",
            "estimatedTimeSaved": "0 mins"
        }

    return {
        "rootCause": best_match['root_cause'],
        "confidence": f"{round(highest_score * 100, 1)}%",
        "recommendedAction": best_match['resolution'],
        "estimatedTimeSaved": best_match['time_saved']
    }

@app.put("/api/incidents/{incident_id}/resolve")
def resolve_incident(incident_id: str):
    return {"status": "success", "message": "Incident resolved."}

@app.put("/api/incidents/{incident_id}/rollback")
def rollback_incident(incident_id: str):
    return {"status": "success", "message": "Rollback script executed."}

@app.post("/api/incidents/{incident_id}/override")
def override_incident(incident_id: str, request: OverrideRequest):
    new_embedding = model.encode(request.error_log)
    new_ticket = {
        "id": f"HIST-LEARNED-{int(datetime.datetime.now().timestamp())}",
        "error_text": request.error_log,
        "root_cause": "Human Override: Discovered via L2 Engineer",
        "resolution": request.new_resolution,
        "time_saved": "Manual",
        "embedding": new_embedding
    }
    historical_tickets.append(new_ticket)
    return {"status": "success", "message": "AI Knowledge Base Updated"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)