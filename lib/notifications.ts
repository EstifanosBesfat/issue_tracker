import prisma from '@/prisma/client';
import { publishToUser } from '@/lib/notificationBus';

type CreateNotificationInput = {
  userId: string;
  issueId: string;
  type: string;
  message: string;
};

// Creates notifications and pushes them instantly to any connected browser
// via SSE (see app/api/notifications/stream/route.ts). Falls back to normal
// polling if the client isn't subscribed.
export async function createNotifications(items: CreateNotificationInput[]) {
  if (items.length === 0) return;

  const created = await Promise.all(
    items.map((item) =>
      prisma.notification.create({
        data: item,
        include: { issue: { select: { id: true, title: true } } },
      })
    )
  );

  for (const notification of created) {
    publishToUser(notification.userId, 'notification', notification);
  }

  return created;
}
