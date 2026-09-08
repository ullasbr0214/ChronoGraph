const API_BASE_URL = "http://127.0.0.1:8000";

// ---------------------------------------------------------
// Helper
// ---------------------------------------------------------

async function handleResponse(response, defaultMessage) {
  if (!response.ok) {
    let message = defaultMessage;

    try {
      const error = await response.json();
      message = error.detail || defaultMessage;
    } catch {
      // Keep default message
    }

    throw new Error(message);
  }

  return response.json();
}


// ---------------------------------------------------------
// Backend health
// ---------------------------------------------------------

export async function getBackendHealth() {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/health`
  );

  return handleResponse(
    response,
    "Backend health check failed"
  );
}


// ---------------------------------------------------------
// Graph health
// ---------------------------------------------------------

export async function getGraphHealth() {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/graph/health`
  );

  return handleResponse(
    response,
    "Graph health check failed"
  );
}


// ---------------------------------------------------------
// Get all events
// ---------------------------------------------------------

export async function getEvents() {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/graph/events`
  );

  return handleResponse(
    response,
    "Failed to fetch events"
  );
}


// ---------------------------------------------------------
// Get one event
// ---------------------------------------------------------

export async function getEvent(eventId) {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/graph/events/${encodeURIComponent(
      eventId
    )}`
  );

  return handleResponse(
    response,
    "Failed to fetch event"
  );
}


// ---------------------------------------------------------
// Get related events
// ---------------------------------------------------------

export async function getRelatedEvents(eventId) {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/graph/events/${encodeURIComponent(
      eventId
    )}/related`
  );

  return handleResponse(
    response,
    "Failed to fetch related events"
  );
}


// ---------------------------------------------------------
// Get complete graph
// ---------------------------------------------------------

export async function getGraph() {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/graph/`
  );

  return handleResponse(
    response,
    "Failed to fetch graph"
  );
}


// ---------------------------------------------------------
// Create event
// ---------------------------------------------------------

export async function createEvent(event) {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/graph/events`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  return handleResponse(
    response,
    "Failed to create event"
  );
}


// ---------------------------------------------------------
// Create relationship
// ---------------------------------------------------------

export async function createRelationship(
  eventId,
  relatedEventId,
  relationship = "RELATED_TO"
) {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/graph/relationships`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_id: eventId,
        related_event_id: relatedEventId,
        relationship,
      }),
    }
  );

  return handleResponse(
    response,
    "Failed to create relationship"
  );
}