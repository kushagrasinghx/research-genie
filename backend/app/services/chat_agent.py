import re

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
            "- **Only include true edits**: never include suggestions where the original and suggested text are identical.\n"
            "- **No unnecessary edits**: if the provided document is already clear, minimal, and grammatically correct, do **not** propose any changes.\n"
            "- **Suggestion count key**: when providing writing suggestions, include `SUGGESTION_COUNT: <integer>` before any suggestions block. This count must equal the number of actual edit suggestions.\n"
            "- If there are no required edits, respond with exactly:\n"
            # "  `SUGGESTION_COUNT: 0`\n"
            "  followed by a short plain sentence (not inside a suggestions block).\n"
            "- Never write 'No changes needed' as a suggestion reason line.\n"
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

    def _is_suggestion_request(self, message: str) -> bool:
        lowered = message.lower()
        keywords = (
            "grammar",
            "grammatical",
            "proofread",
            "suggest",
            "correction",
            "improve writing",
            "fix",
        )
        return any(word in lowered for word in keywords)

    def _count_suggestions(self, response_text: str) -> int:
        # Count only concrete edits represented by Original lines.
        return len(
            re.findall(
                r"(?m)^\s*-\s+\*\*Original\*\*:\s+.+$",
                response_text,
            )
        )

    def _normalize_text(self, value: str) -> str:
        return re.sub(r"\s+", " ", value).strip().lower()

    def _is_no_change_reason(self, reason_text: str) -> bool:
        lowered = reason_text.lower()
        markers = (
            "no change needed",
            "no changes needed",
            "grammatically correct",
            "already correct",
            "no correction needed",
            "no edits needed",
        )
        return any(marker in lowered for marker in markers)

    def _filter_suggestions_block(self, block_text: str) -> str:
        lines = block_text.splitlines()
        groups = []
        current = {}

        for line in lines:
            original_match = re.match(r"^\s*-\s+\*\*Original\*\*:\s*(.*)\s*$", line)
            suggested_match = re.match(r"^\s*-\s+\*\*Suggested\*\*:\s*(.*)\s*$", line)
            reason_match = re.match(r"^\s*-\s+\*\*Reason\*\*:\s*(.*)\s*$", line)

            if original_match:
                if current:
                    groups.append(current)
                current = {"Original": original_match.group(1).strip()}
                continue
            if suggested_match:
                current["Suggested"] = suggested_match.group(1).strip()
                continue
            if reason_match:
                current["Reason"] = reason_match.group(1).strip()
                groups.append(current)
                current = {}
                continue

        if current:
            groups.append(current)

        filtered_groups = []
        for group in groups:
            original = group.get("Original", "")
            suggested = group.get("Suggested", "")
            reason = group.get("Reason", "")
            if not original or not suggested:
                continue
            if self._normalize_text(original) == self._normalize_text(suggested):
                continue
            if reason and self._is_no_change_reason(reason):
                continue
            filtered_groups.append(group)

        if not filtered_groups:
            return ""

        rendered = []
        for group in filtered_groups:
            rendered.append(f"- **Original**: {group['Original']}")
            rendered.append(f"- **Suggested**: {group['Suggested']}")
            if group.get("Reason"):
                rendered.append(f"- **Reason**: {group['Reason']}")
        return "\n".join(rendered)

    def _filter_no_change_suggestions(self, response_text: str) -> str:
        block_pattern = re.compile(r"```suggestions\s*(.*?)```", re.DOTALL | re.IGNORECASE)

        def _replace(match: re.Match) -> str:
            filtered_block = self._filter_suggestions_block(match.group(1))
            if not filtered_block:
                return ""
            return f"```suggestions\n{filtered_block}\n```"

        cleaned = block_pattern.sub(_replace, response_text)
        # Remove excess blank lines created by empty removed blocks.
        return re.sub(r"\n{3,}", "\n\n", cleaned).strip()

    def _ensure_suggestion_count(self, message: str, response_text: str) -> str:
        filtered_response = self._filter_no_change_suggestions(response_text)
        needs_count = (
            self._is_suggestion_request(message)
            or "```suggestions" in filtered_response
            or "SUGGESTION_COUNT:" in response_text
            or "SUGGESTIONS:" in response_text
        )
        if not needs_count:
            return filtered_response

        count = self._count_suggestions(filtered_response)
        cleaned = re.sub(
            r"(?m)^\s*SUGGESTION_COUNT:\s*\d+\s*$\n?",
            "",
            filtered_response,
        )
        cleaned = re.sub(
            r"(?m)^\s*SUGGESTIONS:\s*\d+\s*$\n?",
            "",
            cleaned,
        ).strip()
        if cleaned:
            return f"SUGGESTION_COUNT: {count}\n\n{cleaned}"
        return f"SUGGESTION_COUNT: {count}"

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

        full_response_parts = []
        for chunk in response:
            if chunk.text:
                full_response_parts.append(chunk.text)

        final_text = self._ensure_suggestion_count(message, "".join(full_response_parts))
        if final_text:
            yield final_text
