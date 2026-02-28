import json
import re
import uuid

from google import genai

from app.core.config import get_settings


class SuggestionAgent:
    def __init__(self):
        settings = get_settings()
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model = settings.gemini_model

    async def get_suggestions(self, document: str) -> list[dict]:
        prompt = self._build_prompt(document)

        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "temperature": 0.3,
                },
            )
            return self._parse_response(response.text)
        except Exception as e:
            raise RuntimeError(f"Gemini API call failed: {str(e)}")

    def _build_prompt(self, document: str) -> str:
        return f"""You are an expert academic writing assistant specializing in IEEE conference and journal papers.

Analyze the following academic document and provide specific, actionable suggestions to improve its quality. Focus on:

1. **Clarity**: Identify vague or ambiguous sentences and suggest clearer alternatives.
2. **Academic tone**: Flag informal language and suggest formal academic alternatives.
3. **Conciseness**: Find wordy or redundant phrasing and suggest tighter versions.
4. **Technical precision**: Identify imprecise technical claims and suggest more rigorous phrasing.
5. **Flow and transitions**: Suggest better transitions between ideas or paragraphs.
6. **Grammar and style**: Fix grammatical errors and improve sentence structure.

Be section-aware: consider the purpose of each section (Abstract should be concise, Introduction should contextualize, Methodology should be precise, etc.).

Return a JSON array of suggestion objects. Each object must have exactly these fields:
- "original_text": the exact text from the document being improved (must be a verbatim substring)
- "suggested_text": the improved replacement text
- "reason": a brief explanation of why this change improves the writing
- "confidence_score": a float between 0.0 and 1.0 indicating confidence in the suggestion

Provide 5-10 high-quality suggestions. Only suggest changes that meaningfully improve the paper.

DOCUMENT:
---
{document}
---

Respond ONLY with the JSON array. No markdown formatting, no code fences."""

    def _parse_response(self, response_text: str) -> list[dict]:
        try:
            suggestions = json.loads(response_text)
            if not isinstance(suggestions, list):
                suggestions = []
        except json.JSONDecodeError:
            json_match = re.search(r"\[.*\]", response_text, re.DOTALL)
            if json_match:
                try:
                    suggestions = json.loads(json_match.group())
                except json.JSONDecodeError:
                    suggestions = []
            else:
                suggestions = []

        result = []
        for s in suggestions:
            if all(
                k in s
                for k in ("original_text", "suggested_text", "reason", "confidence_score")
            ):
                result.append(
                    {
                        "id": str(uuid.uuid4()),
                        "original_text": str(s["original_text"]),
                        "suggested_text": str(s["suggested_text"]),
                        "reason": str(s["reason"]),
                        "confidence_score": max(
                            0.0, min(1.0, float(s.get("confidence_score", 0.5)))
                        ),
                    }
                )
        return result
