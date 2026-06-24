# **Neural Nexus - Premium AI-Powered Study Assistant**

Neural Nexus is a modern, high-performance study companion application featuring a React-based frontend and a FastAPI Python backend powered by the Gemini 2.5 Flash model.

---

## Features

- **💬 Study Workspace (Chat)**: Interactive chat sessions with three customized AI personas (Friendly Guide, Academic Professor, Socratic Tutor).
- **📝 Quiz Generator**: Generate custom multiple-choice quizzes on any topic or based on uploaded notes.
- **📚 My Documents**: Upload and index your own learning materials (`.txt`, `.md`, `.py`, `.json`, `.csv`) and chat directly with them.
- **📅 Study Plans**: Create day-by-day structured syllabuses and timelines for learning any topic.

---

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Python 3.10+** (Python 3.13 recommended)
3. **Gemini API Key**: Obtain a key from [Google AI Studio](https://aistudio.google.com/).

---

## Setup & Configuration

1. In the `my-study-assistant` folder, duplicate the `env.example` file and rename it to `.env`:
   ```bash
   cp env.example .env
   ```
2. Open the `.env` file and insert your Gemini API Key:
   ```env
   GEMINI_API_KEY=AIzaSy...
   ```

---

## How to Run

### Method 1: Development Mode (Recommended for making changes)

Runs the backend API and frontend dev server separately with hot-reloading active.

#### 1. Start the Backend (FastAPI)

Open a terminal in `my-study-assistant`:

```powershell
# Install dependencies
.\env\Scripts\pip.exe install -r requirements.txt

# Start FastAPI server
.\env\Scripts\python.exe -m uvicorn app:app --reload
```

*The API will be available at `http://127.0.0.1:8000`.*

#### 2. Start the Frontend (Vite)

Open a second terminal in `my-study-assistant`:

```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

*The application will open at `http://localhost:5173`. Requests to `/api` are automatically proxied to the FastAPI server.*

---

### Method 2: Unified Mode (Production Style)

Compiles the React frontend into static files, which are then served directly by the FastAPI backend. You only need to run a single server.

1. Open a terminal in `my-study-assistant`.
2. Build the production bundle:
   ```bash
   npm install
   npm run build
   ```
3. Run the backend server:
   ```powershell
   .\env\Scripts\python.exe -m uvicorn app:app
   ```
4. Navigate to **`http://127.0.0.1:8000`** in your browser.
