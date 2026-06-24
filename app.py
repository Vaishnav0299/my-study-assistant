import os
import gradio as gr
from google import genai
from google.genai import types

# Fetch the API key securely from Hugging Face Secrets or local environment
api_key = os.environ.get("GEMINI_API_KEY")

if not api_key and os.path.exists(".env"):
    with open(".env") as f:
        for line in f:
            if line.strip() and not line.startswith("#"):
                parts = line.strip().split("=", 1)
                if len(parts) == 2 and parts[0].strip() == "GEMINI_API_KEY":
                    api_key = parts[1].strip().strip('"').strip("'")

# Initialize GenAI Client
client = None
if api_key:
    client = genai.Client(api_key=api_key)

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

def study_assistant_chat(message, history, persona, custom_key=None):
    global client
    # Resolve API Key
    active_key = api_key or (custom_key.strip() if custom_key else None)
    
    if not active_key:
        return "⚠️ API Key is missing! Please enter a valid Gemini API Key in the settings panel on the left."

    # Dynamically initialize/update client if the key changed
    try:
        current_client = genai.Client(api_key=active_key)
    except Exception as e:
        return f"⚠️ Error initializing client with API key: {str(e)}"

    system_prompt = personalities.get(persona, personalities["✨ Friendly Guide"])

    # Convert chat history to types.Content structure for Gemini SDK
    contents = []
    for user_msg, bot_msg in history:
        if user_msg:
            contents.append(types.Content(role="user", parts=[types.Part.from_text(text=user_msg)]))
        if bot_msg:
            contents.append(types.Content(role="model", parts=[types.Part.from_text(text=bot_msg)]))
            
    # Append the new user message
    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=message)]))

    try:
        response = current_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.5,
                max_output_tokens=2000
            )
        )
        return response.text
    except Exception as e:
        return f"⚠️ API Error: {str(e)}\n(Please ensure your API Key is valid and has access to gemini-2.5-flash)"

# Custom CSS for SaaS-grade visual style
custom_css = """
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@400;500;600;700&display=swap');

/* Font application */
body, .gradio-container, .gr-button, .gr-text-input, .gr-markdown {
    font-family: 'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif !important;
}

/* Background system */
body, .gradio-container {
    background: radial-gradient(circle at 50% 0%, #1e1b4b 0%, #0f172a 50%, #05070f 100%) !important;
    color: #f9fafb !important;
}

/* Header container styling */
.header-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    background: rgba(17, 24, 39, 0.6) !important;
    backdrop-filter: blur(12px) !important;
    border-bottom: 1px solid #1f2937 !important;
    border-radius: 16px !important;
    margin-bottom: 1.5rem !important;
}

.header-title-section h1 {
    font-family: 'Poppins', sans-serif !important;
    font-size: 2.2rem !important;
    font-weight: 800 !important;
    background: linear-gradient(135deg, #a78bfa 0%, #c084fc 50%, #8b5cf6 100%);
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    margin: 0 !important;
    text-shadow: 0 4px 15px rgba(139, 92, 246, 0.25);
}

.header-title-section p {
    font-size: 0.95rem !important;
    color: rgba(249, 250, 251, 0.7) !important;
    margin: 4px 0 0 0 !important;
}

/* Status Indicator */
.status-indicator {
    background: rgba(16, 185, 129, 0.1) !important;
    border: 1px solid rgba(16, 185, 129, 0.3) !important;
    color: #10b981 !important;
    padding: 6px 14px !important;
    border-radius: 20px !important;
    font-size: 0.85rem !important;
    font-weight: 600 !important;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 10px;
}

/* Glassmorphic Side & Main panels */
.sidebar-panel {
    background: rgba(17, 24, 39, 0.75) !important;
    backdrop-filter: blur(16px) !important;
    border: 1px solid #1f2937 !important;
    border-radius: 20px !important;
    padding: 1.5rem !important;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
}

.main-chat-panel {
    background: rgba(17, 24, 39, 0.5) !important;
    backdrop-filter: blur(16px) !important;
    border: 1px solid #1f2937 !important;
    border-radius: 20px !important;
    padding: 1.5rem !important;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
}

/* Section titles */
.section-title {
    font-family: 'Poppins', sans-serif !important;
    font-size: 1.1rem !important;
    font-weight: 700 !important;
    color: #f9fafb !important;
    margin-bottom: 1rem !important;
    display: flex;
    align-items: center;
    gap: 8px;
}

/* Learning Stats styling */
.stats-card {
    background: rgba(31, 41, 55, 0.4) !important;
    border: 1px solid #1f2937 !important;
    border-radius: 12px !important;
    padding: 1rem !important;
    margin-top: 10px !important;
}

.stats-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.stats-row:last-child {
    border-bottom: none;
}

.stats-label {
    color: #9ca3af !important;
    font-size: 0.85rem !important;
}

.stats-value {
    color: #f9fafb !important;
    font-weight: 700 !important;
    font-size: 0.85rem !important;
}

/* Quick Action Prompt Cards */
.quick-action-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 15px;
}

.quick-card {
    background: rgba(17, 24, 39, 0.8) !important;
    border: 1px solid #1f2937 !important;
    border-radius: 12px !important;
    padding: 12px !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    text-align: left !important;
    height: auto !important;
    display: block !important;
}

.quick-card:hover {
    border-color: #8b5cf6 !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 24px rgba(139, 92, 246, 0.15) !important;
    background: rgba(139, 92, 246, 0.05) !important;
}

/* Chat Input Section */
.input-row {
    display: flex !important;
    gap: 8px !important;
    align-items: center !important;
}

.send-btn {
    background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%) !important;
    border: none !important;
    color: white !important;
    font-weight: bold !important;
    font-size: 1.2rem !important;
    border-radius: 12px !important;
    max-height: 50px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: all 0.2s ease !important;
    box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4) !important;
}

.send-btn:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 6px 20px rgba(139, 92, 246, 0.6) !important;
}

.tool-btn {
    background: rgba(31, 41, 55, 0.5) !important;
    border: 1px solid #1f2937 !important;
    color: #d1d5db !important;
    border-radius: 10px !important;
    font-size: 0.8rem !important;
    padding: 6px 12px !important;
    transition: all 0.2s ease !important;
}

.tool-btn:hover {
    background: rgba(31, 41, 55, 0.8) !important;
    border-color: #4b5563 !important;
    color: #ffffff !important;
}

/* Chatbot styling overrides */
.chatbot-container {
    border-radius: 16px !important;
    border: 1px solid #1f2937 !important;
    background: #0b0f19 !important;
}

/* Empty placeholder styling */
.welcome-container {
    text-align: center;
    padding: 2.5rem 1rem;
    max-width: 500px;
    margin: 2rem auto;
}

.welcome-icon {
    font-size: 3rem;
    margin-bottom: 0.5rem;
}

.welcome-title {
    font-family: 'Poppins', sans-serif !important;
    font-size: 1.6rem !important;
    font-weight: 700 !important;
    color: #ffffff !important;
    margin-bottom: 0.5rem !important;
}

.welcome-desc {
    color: #9ca3af !important;
    font-size: 0.95rem !important;
    margin-bottom: 1.5rem !important;
}

.welcome-suggestion-box {
    background: rgba(31, 41, 55, 0.3);
    border: 1px solid #1f2937;
    border-radius: 12px;
    padding: 1rem;
    text-align: left;
}

.welcome-suggestion-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: #a78bfa;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.welcome-suggestion-item {
    font-size: 0.85rem;
    color: #d1d5db;
    margin: 6px 0;
}
"""

chatbot_placeholder = """
<div class="welcome-container">
    <div class="welcome-icon">🤖</div>
    <div class="welcome-title">Welcome to StudySphere AI</div>
    <p class="welcome-desc">Your premium AI-powered learning companion. Ask questions, generate study summaries, solve homework, or test your skills.</p>
    <div class="welcome-suggestion-box">
        <div class="welcome-suggestion-title">💡 How to start:</div>
        <div class="welcome-suggestion-item">👉 Choose an <b>Assistant Personality</b> in the sidebar</div>
        <div class="welcome-suggestion-item">👉 Click a <b>Quick Action</b> card below to populate the editor</div>
        <div class="welcome-suggestion-item">👉 Ask a question directly or drop text/files using the attachment tool</div>
    </div>
</div>
"""

def load_file_content(file):
    if file is None:
        return ""
    try:
        # file.name holds the temporary file path
        filepath = file.name
        ext = os.path.splitext(filepath)[1].lower()
        if ext in [".txt", ".md", ".py", ".json", ".csv"]:
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            return f"\n\n[Uploaded Notes / File Content ({os.path.basename(filepath)}):\n{content[:5000]}]"
        else:
            return f"\n\n[Uploaded File: {os.path.basename(filepath)} (Note: Only text files like txt, md, py, csv are parsed in this study assistant prototype)]"
    except Exception as e:
        return f"\n\n[Error reading file: {str(e)}]"

def render_stats_html(stats):
    return f"""
    <div class="stats-card">
        <div class="stats-row">
            <span class="stats-label">Questions Asked</span>
            <span class="stats-value">{stats["questions_asked"]}</span>
        </div>
        <div class="stats-row">
            <span class="stats-label">Topics Learned</span>
            <span class="stats-value">{stats["topics_learned"]}</span>
        </div>
        <div class="stats-row">
            <span class="stats-label">Estimated Study Time</span>
            <span class="stats-value">{stats["questions_asked"] * 0.1:.1f} hrs</span>
        </div>
    </div>
    """

def get_connection_status(key_input):
    active_key = api_key or (key_input.strip() if key_input else None)
    if active_key:
        return """<div class="status-indicator">🟢 Gemini Connected</div>"""
    else:
        return """<div class="status-indicator" style="background: rgba(245, 158, 11, 0.1) !important; border-color: rgba(245, 158, 11, 0.3) !important; color: #f59e0b !important;">🟡 Local API Mode</div>"""

with gr.Blocks() as demo:
    
    # States for Learning Stats
    stats_state = gr.State(value={"questions_asked": 0, "topics_learned": 0})
    
    # Header Layout
    with gr.Row(elem_classes=["header-container"]):
        with gr.Column(scale=3):
            gr.HTML("""
            <div class="header-title-section">
                <h1>StudySphere AI</h1>
                <p>Your AI-powered learning companion. Ask questions, generate summaries, and study smarter.</p>
            </div>
            """)
        with gr.Column(scale=1):
            status_indicator = gr.HTML(value=get_connection_status(""))
            
    # Main grid
    with gr.Row(equal_height=True):
        
        # Left Panel (Sidebar - 25% scale=1)
        with gr.Column(scale=1, min_width=280, elem_classes=["sidebar-panel"]):
            
            # Nav Menu Header
            gr.HTML("<h3>🏠 Platform Menu</h3>", elem_classes=["section-title"])
            
            # Static indicators for visual SaaS navigation
            gr.Radio(
                choices=["🏠 Dashboard & Chat", "🧠 Quiz Generator", "📄 My Documents", "📚 Study Plans"],
                value="🏠 Dashboard & Chat",
                label="Navigation View",
                interactive=True
            )
            
            gr.HTML("<div style='height: 15px;'></div>")
            
            # Learning Stats
            gr.HTML("<h3>📈 Today's Learning Stats</h3>", elem_classes=["section-title"])
            stats_display = gr.HTML(value=render_stats_html({"questions_asked": 0, "topics_learned": 0}))
            
            gr.HTML("<div style='height: 15px;'></div>")
            
            # Sidebar controls & settings
            gr.HTML("<h3>⚙️ Study Settings</h3>", elem_classes=["section-title"])
            
            # Personality selection
            persona = gr.Radio(
                choices=list(personalities.keys()),
                value="✨ Friendly Guide",
                label="Assistant Personality",
            )
            
            # Custom API Key setup
            with gr.Accordion("🔑 Custom API Key (Optional)", open=not api_key):
                custom_key = gr.Textbox(
                    label="Gemini API Key", 
                    placeholder="AIzaSy...", 
                    type="password",
                    value=""
                )
                
            # Wire status indicator to key changes
            custom_key.change(fn=get_connection_status, inputs=custom_key, outputs=status_indicator)
            
        # Right Panel (Chat workspace - 75% scale=3)
        with gr.Column(scale=3, elem_classes=["main-chat-panel"]):
            gr.HTML("<h3>💬 Study Space</h3>", elem_classes=["section-title"])
            
            # Conversation chatbot window
            chatbot = gr.Chatbot(
                label="Study Session",
                elem_classes=["chatbot-container"],
                height=450,
                placeholder=chatbot_placeholder
            )
            
            # Quick Action Cards
            gr.HTML("<h3>⚡ Quick Actions</h3>", elem_classes=["section-title"])
            with gr.Row(elem_classes=["quick-action-grid"]):
                summarize_btn = gr.Button("📘 Summarize Notes\nList core concepts", elem_classes=["quick-card"])
                quiz_btn = gr.Button("🧠 Quiz Me\nAsk 3 conceptual Qs", elem_classes=["quick-card"])
                mcq_btn = gr.Button("📝 Generate MCQs\nBuild multi-choice test", elem_classes=["quick-card"])
                explain_btn = gr.Button("📊 Explain Concepts\nSocratic breakdown", elem_classes=["quick-card"])
                
            # Main prompt input box
            with gr.Row(elem_classes=["input-row"]):
                question_input = gr.Textbox(
                    placeholder="Ask anything about your studies... (e.g. Break down Bayes' theorem with an analogy)",
                    label="Your Study Query",
                    lines=2,
                    scale=9
                )
                submit_btn = gr.Button("➤", elem_classes=["send-btn"], scale=1)
                
            # Attachment and secondary tools
            with gr.Row():
                with gr.Column(scale=3):
                    file_input = gr.File(
                        label="📎 Attach Notes (txt, md, csv, py)", 
                        file_count="single",
                        file_types=[".txt", ".md", ".py", ".json", ".csv"],
                        scale=1
                    )
                with gr.Column(scale=1):
                    gr.HTML("<div style='height: 10px;'></div>")
                    clear_btn = gr.Button("🧹 Clear Chat", elem_classes=["tool-btn"])
                    
            # Wire quick action card clicks
            summarize_btn.click(
                fn=lambda: "Summarize my notes on the following topic and list key terms: ", 
                outputs=question_input
            )
            quiz_btn.click(
                fn=lambda: "Quiz me on this topic by asking me 3 conceptual questions: ", 
                outputs=question_input
            )
            mcq_btn.click(
                fn=lambda: "Generate 3 multiple choice questions (MCQs) to test my knowledge on: ", 
                outputs=question_input
            )
            explain_btn.click(
                fn=lambda: "Break down the core concepts of this topic using a Socratic teaching style: ", 
                outputs=question_input
            )

    # Core logic flow
    def user_submit(message, file, history):
        if not message.strip() and not file:
            return "", None, history
            
        file_content = load_file_content(file)
        full_message = message + file_content
        
        new_history = history + [{"role": "user", "content": full_message}]
        return "", None, new_history

    def bot_respond(history, selected_persona, key_input, stats):
        if not history or history[-1].get("role") != "user":
            return history, stats, render_stats_html(stats)
            
        user_message = history[-1].get("content")
        formatted_history = []
        user_msg_temp = None
        
        # Parse history list for api query
        for msg in history[:-1]:
            role = msg.role if hasattr(msg, "role") else msg.get("role")
            content = msg.content if hasattr(msg, "content") else msg.get("content")
            
            if role == "user":
                user_msg_temp = content
            elif role == "model" and user_msg_temp is not None:
                formatted_history.append((user_msg_temp, content))
                user_msg_temp = None
                
        # Query API
        bot_response = study_assistant_chat(user_message, formatted_history, selected_persona, key_input)
        
        history.append({"role": "model", "content": bot_response})
        
        # Update dynamic stats counters
        new_stats = {
            "questions_asked": stats["questions_asked"] + 1,
            "topics_learned": stats["topics_learned"] + (1 if len(user_message) > 15 else 0)
        }
        
        return history, new_stats, render_stats_html(new_stats)

    # Wire event flows
    submit_btn.click(
        fn=user_submit,
        inputs=[question_input, file_input, chatbot],
        outputs=[question_input, file_input, chatbot],
        queue=True
    ).then(
        fn=bot_respond,
        inputs=[chatbot, persona, custom_key, stats_state],
        outputs=[chatbot, stats_state, stats_display]
    )

    question_input.submit(
        fn=user_submit,
        inputs=[question_input, file_input, chatbot],
        outputs=[question_input, file_input, chatbot],
        queue=True
    ).then(
        fn=bot_respond,
        inputs=[chatbot, persona, custom_key, stats_state],
        outputs=[chatbot, stats_state, stats_display]
    )

    # Reset chat & stats
    def reset_workspace():
        initial_stats = {"questions_asked": 0, "topics_learned": 0}
        return [], "", None, initial_stats, render_stats_html(initial_stats)

    clear_btn.click(
        fn=reset_workspace, 
        outputs=[chatbot, question_input, file_input, stats_state, stats_display]
    )

if __name__ == "__main__":
    demo.launch(
        css=custom_css, 
        theme=gr.themes.Default(primary_hue="indigo", secondary_hue="violet")
    )