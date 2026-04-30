import logging
from datetime import datetime
from typing import List

from fastapi import APIRouter, HTTPException

from ..graph.pipeline import pipeline
from ..graph.state import build_initial_state
from ..schemas import HistoryEntry, TicketRequest, TicketResponse

logger = logging.getLogger(__name__)
router = APIRouter()


ticket_history: List[dict] = []


@router.post("/classify", response_model=TicketResponse)
async def classify_ticket(request: TicketRequest) -> TicketResponse:
    logger.info(f"Received classification request, ticket length: {len(request.ticket_text)}")

    try:
        result = await pipeline.ainvoke(build_initial_state(request.ticket_text))
        logger.info(f"Pipeline completed. Category: {result.get('issue_category')}")

        ticket_history.append({
            "id": len(ticket_history) + 1,
            "timestamp": datetime.now().isoformat(),
            "preview": request.ticket_text[:60] + ("…" if len(request.ticket_text) > 60 else ""),
            "issue_category": result.get("issue_category"),
            "priority": result.get("priority"),
            "confidence_score": result.get("confidence_score"),
            "requires_human_review": result.get("requires_human_review", False),
        })

        return TicketResponse(**{k: result.get(k) for k in TicketResponse.model_fields})
    except Exception as e:
        logger.error(f"Pipeline execution error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history", response_model=List[HistoryEntry])
def get_history() -> List[HistoryEntry]:
    return list(reversed(ticket_history))
