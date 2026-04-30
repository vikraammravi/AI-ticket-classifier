import json
import logging
import re

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage

from .config import (
    CLASSIFICATION_INPUT_COST,
    CLASSIFICATION_MODEL,
    CLASSIFICATION_OUTPUT_COST,
    GUARD_INPUT_COST,
    GUARD_MODEL,
    GUARD_OUTPUT_COST,
)
from .prompts import CLASSIFICATION_PROMPT, INJECTION_GUARD_PROMPT
from .state import TicketState
from .utils import extract_tokens, fallback

logger = logging.getLogger(__name__)


def pii_redaction_node(state: TicketState) -> dict:
    text = state["original_text"]

    text = re.sub(
        r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", "[EMAIL REDACTED]", text
    )
    text = re.sub(r"\b(?:\d{4}[\s-]?){3}\d{4}\b", "[CREDIT CARD REDACTED]", text)
    text = re.sub(
        r"(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}", "[PHONE REDACTED]", text
    )

    logger.info(f"PII redaction completed. Final text length: {len(text)} characters")
    return {"redacted_text": text}


def injection_guard_node(state: TicketState) -> dict:
    text = state["redacted_text"]
    model = ChatAnthropic(model=GUARD_MODEL)

    # Input is wrapped in XML tags so the model treats it as data, not instructions.
    response = model.invoke(
        [
            SystemMessage(content=INJECTION_GUARD_PROMPT),
            HumanMessage(content=f"<input>{text}</input>"),
        ]
    )

    detected = "YES" in response.content.upper()
    logger.info(f"Injection guard: {'ATTACK DETECTED' if detected else 'clean'}")
    return {
        "injection_detected": detected,
        "guard_tokens": extract_tokens(response),
    }


def classification_node(state: TicketState) -> dict:
    logger.info("Starting ticket classification")

    if state["injection_detected"]:
        logger.warning("Injection detected, skipping classification")
        return fallback("Prompt injection detected, ticket rejected")

    text = state["redacted_text"]

    try:
        model = ChatAnthropic(model=CLASSIFICATION_MODEL)
        response = model.invoke(
            [
                SystemMessage(content=CLASSIFICATION_PROMPT),
                HumanMessage(content=text),
            ]
        )

        raw = response.content.strip()
        if raw.startswith("```"):
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)

        result = json.loads(raw)
        if result.get("confidence_score", 0) < 0.7:
            result["requires_human_review"] = True
        result["error"] = None
        result["classification_tokens"] = extract_tokens(response)
        logger.info(f"Classification completed: {result.get('issue_category')}")
        return result

    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing error: {e}")
        return fallback("Failed to parse classification response", str(e))
    except Exception as e:
        logger.error(f"Classification error: {e}")
        return fallback("Classification failed", str(e))


def cost_calculator_node(state: TicketState) -> dict:
    guard    = state.get("guard_tokens") or {}
    classify = state.get("classification_tokens") or {}

    cost = (
        guard.get("input",  0) * GUARD_INPUT_COST +
        guard.get("output", 0) * GUARD_OUTPUT_COST +
        classify.get("input",  0) * CLASSIFICATION_INPUT_COST +
        classify.get("output", 0) * CLASSIFICATION_OUTPUT_COST
    )
    logger.info(f"Cost — guard: {guard}, classify: {classify}, total: ${cost:.6f}")
    return {"total_cost": round(cost, 8)}
