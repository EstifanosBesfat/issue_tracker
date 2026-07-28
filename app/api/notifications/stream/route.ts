import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { subscribe } from '@/lib/notificationBus';

export const dynamic = 'force-dynamic';

const HEARTBEAT_MS = 25_000;

// GET /api/notifications/stream — Server-Sent Events channel for real-time
// notification delivery. Replaces 30s polling with instant push while the
// tab is open; NotificationBell falls back to polling if this disconnects.
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;
  const encoder = new TextEncoder();

  let unsubscribe: () => void = () => {};
  let heartbeat: ReturnType<typeof setInterval>;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      unsubscribe = subscribe(userId, controller);

      controller.enqueue(encoder.encode('event: connected\ndata: {}\n\n'));

      heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
        }
      }, HEARTBEAT_MS);

      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
    cancel() {
      clearInterval(heartbeat);
      unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
