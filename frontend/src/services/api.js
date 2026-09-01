const API_BASE_URL = "http://127.0.0.1:8000";

export async function getBackendHealth() {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/health`
  );

  if (!response.ok) {
    throw new Error("Backend health check failed");
  }

  return response.json();
}

export async function getGraphHealth() {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/graph/health`
  );

  if (!response.ok) {
    throw new Error("Graph health check failed");
  }

  return response.json();
}

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

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to create event");
  }

  return response.json();
}