const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function checkIEEE(document) {
  const response = await fetch(`${API_BASE}/check-ieee`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function getSuggestions(document) {
  const response = await fetch(`${API_BASE}/get-suggestions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ document }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Unknown error" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function streamChat(
  { message, document, history },
  onToken,
  onDone,
  onError,
) {
  const controller = new AbortController();

  try {
    const response = await fetch(`${API_BASE}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, document, history }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Unknown error" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.token) {
              onToken(payload.token);
            } else if (payload.done) {
              onDone?.();
            } else if (payload.error) {
              onError?.(payload.error);
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }
    }

    onDone?.();
  } catch (err) {
    if (err.name !== "AbortError") {
      onError?.(err.message);
    }
  }

  return controller;
}
