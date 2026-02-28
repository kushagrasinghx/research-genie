import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.services.ieee_agent import IEEEComplianceAgent
from app.services.suggestion_agent import SuggestionAgent
from app.services.chat_agent import ChatAgent

router = APIRouter()


class DocumentRequest(BaseModel):
    document: str = Field(..., min_length=1, description="The document text to analyze")


class ViolationResponse(BaseModel):
    violations: list[dict]


class SuggestionResponse(BaseModel):
    suggestions: list[dict]


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="The user's message")
    document: str = Field(default="", description="Current document text for context")
    history: list[dict] = Field(
        default=[], description="Conversation history [{role, content}]"
    )


ieee_agent = IEEEComplianceAgent()
suggestion_agent = SuggestionAgent()
chat_agent = ChatAgent()


@router.post("/check-ieee", response_model=ViolationResponse)
async def check_ieee(request: DocumentRequest):
    try:
        violations = ieee_agent.check_compliance(request.document)
        return ViolationResponse(violations=violations)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"IEEE check failed: {str(e)}")


@router.post("/get-suggestions", response_model=SuggestionResponse)
async def get_suggestions(request: DocumentRequest):
    try:
        suggestions = await suggestion_agent.get_suggestions(request.document)
        return SuggestionResponse(suggestions=suggestions)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Suggestion generation failed: {str(e)}"
        )


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """SSE streaming endpoint for AI chat responses."""

    # Map frontend role names to Gemini role names
    mapped_history = []
    for entry in request.history:
        role = entry.get("role", "user")
        if role == "assistant":
            role = "model"
        mapped_history.append({"role": role, "content": entry.get("content", "")})

    def event_generator():
        try:
            for chunk in chat_agent.stream_chat(
                message=request.message,
                document=request.document,
                history=mapped_history,
            ):
                yield f"data: {json.dumps({'token': chunk})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
