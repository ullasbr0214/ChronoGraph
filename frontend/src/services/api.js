const API_BASE_URL = "http://127.0.0.1:8000";

// ---------------------------------------------------------
// Helper
// ---------------------------------------------------------

async function handleResponse(response, defaultMessage) {
  if (!response.ok) {
    let message = defaultMessage;

    try {
      const error = await response.json();

      if (typeof error?.detail === "string") {
        message = error.detail;
      } else if (error?.detail) {
        message = JSON.stringify(error.detail);
      }
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
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/health`
    );

    return await handleResponse(
      response,
      "Backend health check failed"
    );
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Unable to connect to the ChronoGraph backend."
      );
    }

    throw error;
  }
}


// ---------------------------------------------------------
// Graph health
// ---------------------------------------------------------

export async function getGraphHealth() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/graph/health`
    );

    return await handleResponse(
      response,
      "Graph health check failed"
    );
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Unable to connect to the Neo4j graph service."
      );
    }

    throw error;
  }
}


// ---------------------------------------------------------
// Get all events
// ---------------------------------------------------------

export async function getEvents() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/graph/events`
    );

    const data = await handleResponse(
      response,
      "Failed to fetch events"
    );

    console.log("🔥 EVENTS FROM BACKEND:", data);

    return Array.isArray(data)
      ? data
      : Array.isArray(data?.events)
        ? data.events
        : [];
  } catch (error) {
    console.error("🔥 GET EVENTS ERROR:", error);

    if (error instanceof TypeError) {
      throw new Error(
        "Unable to connect to the ChronoGraph backend."
      );
    }

    throw error;
  }
}

// ---------------------------------------------------------
// Get one event
// ---------------------------------------------------------

export async function getEvent(eventId) {
  if (!eventId) {
    throw new Error("Event ID is required");
  }

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
  if (!eventId) {
    throw new Error("Event ID is required");
  }

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
  if (!event || typeof event !== "object") {
    throw new Error(
      "A valid event object is required"
    );
  }

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
  if (!eventId) {
    throw new Error(
      "Source event ID is required"
    );
  }

  if (!relatedEventId) {
    throw new Error(
      "Related event ID is required"
    );
  }

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