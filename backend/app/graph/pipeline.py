import logging

from langgraph.graph import END, StateGraph

from .nodes import (
    classification_node,
    cost_calculator_node,
    injection_guard_node,
    pii_redaction_node,
)
from .state import TicketState

logger = logging.getLogger(__name__)


def _route_after_guard(state: TicketState) -> str:
    return "cost_calculator" if state["injection_detected"] else "classification"


def create_pipeline():
    graph = StateGraph(TicketState)

    graph.add_node("pii_redaction", pii_redaction_node)
    graph.add_node("injection_guard", injection_guard_node)
    graph.add_node("classification", classification_node)
    graph.add_node("cost_calculator", cost_calculator_node)

    graph.set_entry_point("pii_redaction")
    graph.add_edge("pii_redaction", "injection_guard")
    graph.add_conditional_edges("injection_guard", _route_after_guard)
    graph.add_edge("classification", "cost_calculator")
    graph.add_edge("cost_calculator", END)

    logger.info("Pipeline created successfully")
    return graph.compile()


pipeline = create_pipeline()
