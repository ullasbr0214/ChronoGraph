const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function handleResponse(response, defaultMessage) {
  let data = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON response.
  }

  if (!response.ok) {
    const detail = data?.detail;
    const message = typeof detail === "string" ? detail : detail ? JSON.stringify(detail) : defaultMessage;
    throw new Error(message);
  }

  return data;
}

async function request(path, options, message) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, options);
    return await handleResponse(response, message);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Unable to connect to the ChronoGraph backend. Start FastAPI on port 8000.");
    }
    throw error;
  }
}

export function getBackendHealth() {
  return request("/api/v1/health", undefined, "Backend health check failed");
}

export function getGraphHealth() {
  return request("/api/v1/graph/health", undefined, "Graph health check failed");
}

export function getEvents() {
  return request("/api/v1/graph/events", undefined, "Failed to fetch events");
}

export function getEvent(eventId) {
  if (!eventId) throw new Error("Event ID is required");
  return request(`/api/v1/graph/events/${encodeURIComponent(eventId)}`, undefined, "Failed to fetch event");
}

export function getRelatedEvents(eventId) {
  if (!eventId) throw new Error("Event ID is required");
  return request(`/api/v1/graph/events/${encodeURIComponent(eventId)}/related`, undefined, "Failed to fetch related events");
}

export function getGraph() {
  return request("/api/v1/graph/", undefined, "Failed to fetch graph");
}

export function createEvent(event) {
  if (!event || typeof event !== "object") throw new Error("A valid event object is required");
  return request("/api/v1/graph/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  }, "Failed to create event");
}

export function createRelationship(eventId, relatedEventId, relationship = "RELATED_TO") {
  if (!eventId) throw new Error("Source event ID is required");
  if (!relatedEventId) throw new Error("Related event ID is required");
  return request("/api/v1/graph/relationships", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event_id: eventId, related_event_id: relatedEventId, relationship }),
  }, "Failed to create relationship");
}
