cd backend
venv\Scripts\activate
python main.py

cd frontend 
npm run dev




# ⚡ ResolveX AI - Enterprise AIOps Command Center

An autonomous, AI-driven Level-1 IT Operations agent built to predict incidents, instantly identify root causes via semantic search, and execute remediation scripts under strict Human-in-the-Loop (HITL) governance.

## 🚀 The Core Innovation
Traditional IT support is heavily reactive, relying on manual ticket triage which causes high Mean Time To Resolution (MTTR). **ResolveX AI** utilizes Retrieval-Augmented Generation (RAG) to instantly convert incoming system errors into vector embeddings, matching them against historical IT logs to provide L1/L2 engineers with immediate, mathematically proven remediation strategies.

## 🛠️ Tech Stack
* **Frontend:** React, Vite, Tailwind CSS v4 (Decoupled, state-driven dashboard)
* **Backend:** Python, FastAPI, Uvicorn (High-performance async API)
* **AI Engine:** `sentence-transformers` (`all-MiniLM-L6-v2`) for local, high-speed semantic vectorization and Cosine Similarity matching.
* **Architecture Concept:** Scalable Microservices designed for GCP/AWS deployment.

## 🔒 Enterprise Guardrails
This project strictly adheres to enterprise compliance by enforcing **Human-in-the-Loop** workflows. The AI acts as an advisory copilot; no automated script execution occurs without explicit cryptographic approval from an authenticated engineer.

## ⚡ Quick Start
**1. Start the AI Engine (Backend)**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
python main.py