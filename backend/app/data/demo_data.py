"""Deterministic local evidence for demos, testing and offline review."""

EVENTS = [
    {
        "id": "EVT-001",
        "source": "System Log",
        "title": "Login Attempt",
        "description": "A user login attempt was detected.",
        "timestamp": "2026-09-06T09:00:00",
        "event_type": "AUTH",
    },
    {
        "id": "EVT-002",
        "source": "Security Log",
        "title": "Multiple Failed Logins",
        "description": "Multiple failed login attempts were detected.",
        "timestamp": "2026-09-06T09:05:00",
        "event_type": "SECURITY",
    },
    {
        "id": "EVT-003",
        "source": "Network Log",
        "title": "Unknown IP Connection",
        "description": "A connection was detected from an unknown IP address.",
        "timestamp": "2026-09-06T09:10:00",
        "event_type": "NETWORK",
    },
    {
        "id": "EVT-004",
        "source": "Application Log",
        "title": "Account Access",
        "description": "The account was accessed after the suspicious connection.",
        "timestamp": "2026-09-06T09:15:00",
        "event_type": "APPLICATION",
    },
]

RELATIONSHIPS = [
    {"source": "EVT-001", "target": "EVT-002", "relationship": "LEADS_TO"},
    {"source": "EVT-002", "target": "EVT-003", "relationship": "CAUSED_BY"},
    {"source": "EVT-003", "target": "EVT-004", "relationship": "LEADS_TO"},
]


def get_demo_events():
    return [dict(event) for event in EVENTS]


def get_demo_graph():
    return {
        "nodes": get_demo_events(),
        "events": get_demo_events(),
        "relationships": [dict(item) for item in RELATIONSHIPS],
    }


def get_demo_related(event_id):
    by_id = {event["id"]: event for event in EVENTS}
    related = []
    for relation in RELATIONSHIPS:
        if relation["source"] == event_id and relation["target"] in by_id:
            item = dict(by_id[relation["target"]])
            item["relationship"] = relation["relationship"]
            related.append(item)
        elif relation["target"] == event_id and relation["source"] in by_id:
            item = dict(by_id[relation["source"]])
            item["relationship"] = relation["relationship"]
            related.append(item)
    return sorted(related, key=lambda item: item.get("timestamp", ""))
