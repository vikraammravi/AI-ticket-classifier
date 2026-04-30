from typing import Optional
from pydantic import BaseModel


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


class HistoryEntry(BaseModel):
    id: int
    timestamp: str
    preview: str
    issue_category: Optional[str]
    priority: Optional[str]
    confidence_score: Optional[float]
    requires_human_review: bool
