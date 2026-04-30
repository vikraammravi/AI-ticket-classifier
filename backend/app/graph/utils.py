def extract_tokens(response) -> dict:
    usage = response.usage_metadata or {}
    return {
        "input":  usage.get("input_tokens", 0),
        "output": usage.get("output_tokens", 0),
    }


def fallback(reasoning: str, error: str | None = None) -> dict:
    return {
        "issue_category": "other",
        "assigned_team": "customer_support",
        "priority": "medium",
        "user_sentiment": "neutral",
        "confidence_score": 0.0,
        "reasoning": reasoning,
        "requires_human_review": True,
        "error": error,
    }
