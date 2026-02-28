from google import genai

from app.core.config import get_settings


class ChatAgent:
    def __init__(self):
        settings = get_settings()
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model = settings.gemini_model

    def _build_contents(self, message: str, document: str, history: list[dict]) -> list:
        system_text = (
            "You are an expert academic research writing assistant. "
            "You have access to the user's current document and help them improve it. "
            "You specialize in IEEE conference and journal papers. "
            "Provide specific, actionable advice. Use markdown formatting in your responses. "
            "When referencing parts of the document, quote them directly. "
            "Be concise but thorough."
        )

        contents = []

        # Inject system prompt and document as a priming exchange
        doc_context = f"[Current Document]\n{document}" if document.strip() else "[No document content yet]"
        contents.append({
            "role": "user",
            "parts": [{"text": f"{system_text}\n\n{doc_context}"}],
        })
        contents.append({
            "role": "model",
            "parts": [{"text": "I've read your document. How can I help you improve it?"}],
        })

        # Append conversation history
        for entry in history:
            role = entry.get("role", "user")
            content = entry.get("content", "")
            if role and content:
                contents.append({
                    "role": role,
                    "parts": [{"text": content}],
                })

        # Append the new user message
        contents.append({
            "role": "user",
            "parts": [{"text": message}],
        })

        return contents

    def stream_chat(self, message: str, document: str, history: list[dict]):
        """Synchronous generator that yields text chunks from Gemini streaming API."""
        contents = self._build_contents(message, document, history)

        response = self.client.models.generate_content_stream(
            model=self.model,
            contents=contents,
            config={
                "temperature": 0.4,
            },
        )

        for chunk in response:
            if chunk.text:
                yield chunk.text
