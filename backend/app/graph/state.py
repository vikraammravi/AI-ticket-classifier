from typing import Optional, TypedDict


class TicketState(TypedDict):
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
    guard_tokens: Optional[dict]
    classification_tokens: Optional[dict]
    total_cost: float
