import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Tuple, Optional
from google import genai
from google.genai import types

app = FastAPI(title="StudySphere AI API")

# Enable CORS for local Vite dev server (usually runs on port 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev simplicity, restrict in production as needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Fetch system-level API key
api_key = os.environ.get("GEMINI_API_KEY")

personalities = {
    "✨ Friendly Guide": """You are a friendly, enthusiastic, and highly encouraging Study Assistant.   
Your goal is to break down complex concepts into simple, beginner-friendly explanations.   
Use clear analogies and relatable real-world examples.   
Always ask an engaging follow-up question to check understanding and keep the student motivated.""",
    
    "🎓 Academic Professor": """You are a strictly academic, highly detailed, and professional university Professor.   
Use precise, formal terminology, cite key concepts, and structure your responses with clean Markdown headers and bullet points.   
Your goal is to provide rigorous, comprehensive explanation.   
Always ask a deep, analytical follow-up question to test the student's conceptual understanding.""",

    "🤔 Socratic Tutor": """You are a Socratic Tutor. You do NOT give direct answers to questions.
Instead, you guide the student to the answer themselves by asking helpful, thought-provoking questions, providing gentle hints, and breaking down the problem into smaller parts.
Encourage critical thinking and self-discovery. Keep your responses relatively short, engaging, and highly interactive."""
}

class ChatRequest(BaseModel):
    message: str
    history: List[Tuple[Optional[str], Optional[str]]]
    persona: str
    custom_key: Optional[str] = None

@app.get("/api/status")
async def status(custom_key: Optional[str] = None):
    # Resolve API Key in priority order
    active_key = api_key or (custom_key.strip() if custom_key else None)
    return {"connected": bool(active_key)}

@app.post("/api/chat")
async def chat(body: ChatRequest):
    # Resolve API Key
    active_key = api_key or (body.custom_key.strip() if body.custom_key else None)
    
    if not active_key:
        raise HTTPException(
            status_code=400, 
            detail="Gemini API Key is missing. Please provide a key in the settings sidebar."
        )

    try:
        client = genai.Client(api_key=active_key)
    except Exception as e:
        raise HTTPException(
            status_code=400, 
            detail=f"Error initializing Gemini client: {str(e)}"
        )

    system_prompt = personalities.get(body.persona, personalities["✨ Friendly Guide"])

    # Build types.Content conversation payload
    contents = []
    for user_msg, bot_msg in body.history:
        if user_msg:
            contents.append(types.Content(role="user", parts=[types.Part.from_text(text=user_msg)]))
        if bot_msg:
            contents.append(types.Content(role="model", parts=[types.Part.from_text(text=bot_msg)]))
            
    # Append the new user message
    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=body.message)]))

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.5,
                max_output_tokens=2000
            )
        )
        return {"response": response.text}
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Gemini API Error: {str(e)}"
        )

# Serve built frontend files in production
dist_path = os.path.join(os.path.dirname(__file__), "dist")
if os.path.exists(dist_path):
    # Mount the assets directory (contains css, js, images)
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_path, "assets")), name="assets")
    
    # Catch-all to serve index.html for React Router / SPA routing
    @app.get("/{rest_of_path:path}")
    async def serve_frontend(rest_of_path: str):
        if rest_of_path.startswith("api/"):
            return JSONResponse(status_code=404, content={"detail": "API endpoint not found"})
        
        index_file = os.path.join(dist_path, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return JSONResponse(status_code=404, content={"detail": "React build output not found."})

if __name__ == "__main__":
    import uvicorn
    # Start server on port 8000
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)