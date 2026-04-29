import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..graph.pipeline import pipeline
from ..graph.state import TicketState

logger = logging.getLogger(__name__)
router = APIRouter()


class TicketRequest(BaseModel):
    ticket_text: str


class TicketResponse(BaseModel):
    original_text: str
    redacted_text: str
    injection_detected: bool
    issue_category: Optional[str]
    assigned_team: Optional[str]
    priority: Optional[str]
    user_sentiment: Optional[str]
    confidence_score: Optional[float]
    reasoning: Optional[str]
    requires_human_review: bool
    error: Optional[str]
    total_cost: float


@router.post("/classify", response_model=TicketResponse)
async def classify_ticket(request: TicketRequest) -> TicketResponse:
    logger.info(f"Received classification request, ticket length: {len(request.ticket_text)}")

    initial_state: TicketState = {
        "original_text": request.ticket_text,
        "redacted_text": "",
        "injection_detected": False,
        "issue_category": None,
        "assigned_team": None,
        "priority": None,
        "user_sentiment": None,
        "confidence_score": None,
        "reasoning": None,
        "requires_human_review": False,
        "error": None,
        "total_cost": 0.0,
    }

    try:
        result = await pipeline.ainvoke(initial_state)
        logger.info(f"Pipeline completed. Category: {result.get('issue_category')}")
        return TicketResponse(**{k: result.get(k) for k in TicketResponse.model_fields})
    except Exception as e:
        logger.error(f"Pipeline execution error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
