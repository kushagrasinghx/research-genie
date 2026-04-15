from google import genai

from app.core.config import get_settings


class ChatAgent:
    def __init__(self):
        settings = get_settings()
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model = settings.gemini_model

    def _build_contents(self, message: str, document: str, history: list[dict]) -> list:
        system_text = (
            "You are an expert academic research writing assistant specializing in IEEE papers. "
            "You have access to the user's current document and provide targeted improvements. "
            "\n\n## Your responsibilities:\n"
            "1. **Grammar & Style**: Fix grammatical errors, awkward phrasing, and improve clarity.\n"
            "2. **Specific suggestions**: When proposing text changes, use this format:\n\n"
            "```suggestions\n"
            "- **Original**: [exact text from document]\n"
            "- **Suggested**: [improved version]\n"
            "- **Reason**: [brief explanation of the improvement]\n"
            "```\n\n"
            "3. **Research context**: When asked, suggest related research papers or citations.\n"
            "4. **Comprehensive feedback**: Address clarity, technical precision, flow, and compliance.\n\n"
            "## Important:\n"
            "- Quote document excerpts directly when suggesting changes.\n"
            "- Provide markdown formatting for readability.\n"
            "- Be specific and actionable; avoid vague feedback.\n"
            "- Group related suggestions together.\n"
            "- **No unnecessary edits**: if the provided document is already clear,minimal, and grammatically correct, do **not** propose any changes.  Instead,respond with a short statement such as 'No changes needed.'  Do *not* wrap that message in a suggestions block.\n"
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
