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


def build_initial_state(ticket_text: str) -> TicketState:
    return {
        "original_text": ticket_text,
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
        "guard_tokens": None,
        "classification_tokens": None,
        "total_cost": 0.0,
    }
