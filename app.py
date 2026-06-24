import os
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing import List, Tuple, Optional
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load configuration from .env file
load_dotenv()

app = FastAPI(title="Neural Nexus API")

# Enable CORS for local Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    model: Optional[str] = "gemini-2.5-flash"

@app.get("/api/status")
async def status():
    # Only verify the server-side environment key (No raw key in browser)
    return {"connected": bool(api_key)}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".txt", ".md", ".py", ".json", ".csv"]:
        raise HTTPException(
            status_code=400, 
            detail="Only .txt, .md, .py, .json, and .csv files are supported."
        )
        
    try:
        content = await file.read()
        text_content = content.decode("utf-8", errors="ignore")
        return {"name": file.filename, "content": text_content}
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to parse file: {str(e)}"
        )

@app.post("/api/chat")
async def chat(body: ChatRequest):
    if not api_key:
        raise HTTPException(
            status_code=400, 
            detail="Gemini API Key is missing on the server. Please set the GEMINI_API_KEY environment variable."
        )

    try:
        client = genai.Client(api_key=api_key)
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

    # Token streaming generator
    def generate():
        try:
            response_stream = client.models.generate_content_stream(
                model=body.model or "gemini-2.5-flash",
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.5,
                    max_output_tokens=2000
                )
            )
            for chunk in response_stream:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            yield f"⚠️ Stream API Error: {str(e)}"

    return StreamingResponse(generate(), media_type="text/plain")

# Serve built frontend files in production
dist_path = os.path.join(os.path.dirname(__file__), "dist")
if os.path.exists(dist_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_path, "assets")), name="assets")
    
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
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)