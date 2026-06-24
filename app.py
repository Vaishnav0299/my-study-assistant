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

# Pre-defined study cards (icon, title, desc, prompt)
QUICK_TOPICS = [
    {"icon": "🌌", "title": "Quantum Physics", "desc": "Explain it simply", "prompt": "Can you explain quantum physics in simple terms with an analogy?"},
    {"icon": "🧬", "title": "Photosynthesis", "desc": "Summarize the process", "prompt": "Could you break down the process of photosynthesis step-by-step?"},
    {"icon": "📊", "title": "Bayes' Theorem", "desc": "Explain with analogy", "prompt": "Can you explain Bayes' Theorem using a simple real-world scenario?"},
    {"icon": "⚔️", "title": "French Revolution", "desc": "Causes & summary", "prompt": "What were the primary causes of the French Revolution? Give a brief summary."}
]

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

# Custom CSS for premium Glassmorphism Dark Theme
custom_css = """
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

/* Apply modern Outfit font */
body, .gradio-container, .gr-button, .gr-text-input, .gr-markdown {
    font-family: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
}

/* Base body styles & dark background */
body, .gradio-container {
    background: radial-gradient(circle at 50% 0%, #171730 0%, #07070d 100%) !important;
    color: #e2e8f0 !important;
}

/* Container limits */
.gradio-container {
    max-width: 1200px !important;
    margin: 0 auto !important;
    padding: 20px !important;
}

/* Custom modern header styling */
.header-container {
    text-align: center;
    padding: 2.5rem 1.5rem;
    background: linear-gradient(180deg, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0) 100%);
    border-radius: 24px;
    margin-bottom: 2rem;
    border: 1px solid rgba(99, 102, 241, 0.15);
    box-shadow: 0 10px 40px -10px rgba(99, 102, 241, 0.15);
}

.header-title {
    font-size: 2.5rem !important;
    font-weight: 800 !important;
    background: linear-gradient(135deg, #e0e7ff 0%, #c084fc 50%, #6366f1 100%);
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    letter-spacing: -0.02em;
    margin: 0 !important;
    padding-bottom: 5px;
}

.header-subtitle {
    font-size: 1.05rem !important;
    color: #94a3b8 !important;
    margin-top: 6px !important;
    font-weight: 400;
}

/* Glassmorphic Cards & Panels */
.glass-panel {
    background: rgba(15, 23, 42, 0.45) !important;
    backdrop-filter: blur(16px) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    border-radius: 18px !important;
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.7) !important;
    padding: 20px !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-panel:hover {
    border-color: rgba(99, 102, 241, 0.3) !important;
    box-shadow: 0 12px 40px -8px rgba(99, 102, 241, 0.12) !important;
}

/* Styling the title headers in the columns */
.section-title {
    font-size: 1.2rem !important;
    font-weight: 700 !important;
    color: #f8fafc !important;
    margin-bottom: 15px !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
    padding-bottom: 8px;
}

/* Quick Topic Prompt Cards */
.topic-card {
    background: rgba(255, 255, 255, 0.03) !important;
    border: 1px solid rgba(255, 255, 255, 0.06) !important;
    border-radius: 12px !important;
    padding: 12px !important;
    cursor: pointer !important;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
    white-space: pre-line !important;
    text-align: left !important;
    height: auto !important;
    min-height: 70px !important;
}

.topic-card:hover {
    background: rgba(99, 102, 241, 0.08) !important;
    border-color: rgba(99, 102, 241, 0.4) !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.18) !important;
}

/* Button override styling */
.primary-btn {
    background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%) !important;
    border: none !important;
    color: white !important;
    font-weight: 600 !important;
    border-radius: 12px !important;
    padding: 10px 20px !important;
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35) !important;
    transition: all 0.2s ease !important;
}

.primary-btn:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5) !important;
}

.secondary-btn {
    background: rgba(255, 255, 255, 0.04) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    color: #e2e8f0 !important;
    font-weight: 500 !important;
    border-radius: 12px !important;
    transition: all 0.2s ease !important;
}

.secondary-btn:hover {
    background: rgba(255, 255, 255, 0.08) !important;
    border-color: rgba(255, 255, 255, 0.15) !important;
}

/* Chatbot interface elements */
.chatbot-container {
    border-radius: 16px !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    background: rgba(15, 23, 42, 0.25) !important;
}

/* Custom adjustments for inputs */
textarea, input[type="text"] {
    background: rgba(15, 23, 42, 0.6) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    border-radius: 12px !important;
    color: #f8fafc !important;
}

textarea:focus, input[type="text"]:focus {
    border-color: #6366f1 !important;
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2) !important;
}
"""

with gr.Blocks() as demo:
    
    # Header Panel
    with gr.Row(elem_classes=["header-container"]):
        with gr.Column():
            gr.HTML("<h1>🧠 StudySphere AI</h1>", elem_classes=["header-title"])
            gr.HTML("<p>Your premium Gemini-powered personal study assistant. Ask anything, prep for tests, and learn at your own pace.</p>", elem_classes=["header-subtitle"])
            
    with gr.Row(equal_height=True):
        
        # Left Panel (Controls and Quick Topics)
        with gr.Column(scale=1, elem_classes=["glass-panel"]):
            gr.HTML("<h3>⚙️ Study Settings</h3>", elem_classes=["section-title"])
            
            # API Key settings accordion (helps with local execution when environment variable is not present)
            with gr.Accordion("🔑 Custom API Key (Optional)", open=not api_key):
                gr.HTML("<p style='font-size: 0.8rem; color: #94a3b8; margin-bottom: 8px;'>If GEMINI_API_KEY is not set in your environment, enter it below. It will only be used locally.</p>")
                custom_key = gr.Textbox(
                    label="Gemini API Key", 
                    placeholder="AIzaSy...", 
                    type="password",
                    value=""
                )
            
            gr.HTML("<div style='height: 10px;'></div>")
            
            # Personality selector
            persona = gr.Radio(
                choices=list(personalities.keys()),
                value="✨ Friendly Guide",
                label="Assistant Personality",
            )
            
            gr.HTML("<div style='height: 20px;'></div>")
            gr.HTML("<h3>🌌 Quick-Start Topics</h3>", elem_classes=["section-title"])
            gr.HTML("<p style='font-size: 0.8rem; color: #94a3b8; margin-bottom: 12px;'>Click a topic to auto-fill the question input box below:</p>")
            
            topic_buttons = []
            with gr.Row():
                for topic in QUICK_TOPICS:
                    btn = gr.Button(
                        value=f"{topic['icon']} {topic['title']}\n{topic['desc']}", 
                        elem_classes=["topic-card"]
                    )
                    topic_buttons.append((btn, topic["prompt"]))
                    
        # Right Panel (Chat workspace)
        with gr.Column(scale=2, elem_classes=["glass-panel"]):
            gr.HTML("<h3>💬 Study Space</h3>", elem_classes=["section-title"])
            
            # Chat history
            chatbot = gr.Chatbot(
                label="Study Conversation",
                elem_classes=["chatbot-container"],
                height=450
            )
            
            # Input row
            with gr.Row(elem_classes=["chat-row"]):
                question_input = gr.Textbox(
                    placeholder="Ask your question here... (e.g. Explain how gravity works)",
                    label="Your Question",
                    lines=2,
                    scale=4
                )
                
            with gr.Row():
                submit_btn = gr.Button("Submit", elem_classes=["primary-btn"], scale=1)
                clear_btn = gr.Button("Clear Chat", elem_classes=["secondary-btn"], scale=1)
                
            # Wire topic card clicks to set the question input
            for btn, prompt_val in topic_buttons:
                btn.click(fn=lambda p=prompt_val: p, outputs=question_input)
                
    # Helper functions for the chatbot flow
    def user_submit(message, history):
        if not message.strip():
            return "", history
        # Return empty message box and append user message to chat history
        # In Gradio 6, chatbot expects list of ChatMessage or list of dicts.
        new_history = history + [{"role": "user", "content": message}]
        return "", new_history

    def bot_respond(history, selected_persona, key_input):
        if not history or history[-1].get("role") != "user":
            return history
        
        user_message = history[-1].get("content")
        # Convert previous history to list of tuples for API context formatter
        formatted_history = []
        user_msg_temp = None
        
        # Iterate over all messages except the very last user message
        for msg in history[:-1]:
            # Handle list of dicts or list of objects
            role = msg.role if hasattr(msg, "role") else msg.get("role")
            content = msg.content if hasattr(msg, "content") else msg.get("content")
            
            if role == "user":
                user_msg_temp = content
            elif role == "model" and user_msg_temp is not None:
                formatted_history.append((user_msg_temp, content))
                user_msg_temp = None
                
        # Generate response
        bot_response = study_assistant_chat(user_message, formatted_history, selected_persona, key_input)
        
        history.append({"role": "model", "content": bot_response})
        return history

    # Wire the submit actions
    submit_btn.click(
        fn=user_submit,
        inputs=[question_input, chatbot],
        outputs=[question_input, chatbot],
        queue=True
    ).then(
        fn=bot_respond,
        inputs=[chatbot, persona, custom_key],
        outputs=[chatbot]
    )

    question_input.submit(
        fn=user_submit,
        inputs=[question_input, chatbot],
        outputs=[question_input, chatbot],
        queue=True
    ).then(
        fn=bot_respond,
        inputs=[chatbot, persona, custom_key],
        outputs=[chatbot]
    )

    clear_btn.click(fn=lambda: ([], ""), outputs=[chatbot, question_input])

# Hugging Face Spaces launch
if __name__ == "__main__":
    demo.launch(
        css=custom_css, 
        theme=gr.themes.Default(primary_hue="indigo", secondary_hue="violet")
    )