// In-memory pub/sub used to push notifications to connected browsers over
// Server-Sent Events (SSE). Works per Node.js process — fine for a single
// `next dev` / single-instance deployment (e.g. Railway). Scaling to multiple
// instances would require a shared bus such as Redis pub/sub.

type Client = {
  controller: ReadableStreamDefaultController<Uint8Array>;
};

const encoder = new TextEncoder();
const clientsByUser = new Map<string, Set<Client>>();

export function subscribe(userId: string, controller: ReadableStreamDefaultController<Uint8Array>) {
  const client: Client = { controller };

  if (!clientsByUser.has(userId)) {
    clientsByUser.set(userId, new Set());
  }
  clientsByUser.get(userId)!.add(client);

  return function unsubscribe() {
    const set = clientsByUser.get(userId);
    if (!set) return;
    set.delete(client);
    if (set.size === 0) clientsByUser.delete(userId);
  };
}

function send(client: Client, event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  try {
    client.controller.enqueue(encoder.encode(payload));
  } catch {
    // Connection already closed — will be cleaned up on next abort signal.
  }
}

export function publishToUser(userId: string, event: string, data: unknown) {
  const set = clientsByUser.get(userId);
  if (!set || set.size === 0) return;
  for (const client of set) send(client, event, data);
}

export function connectedUserCount() {
  return clientsByUser.size;
}
