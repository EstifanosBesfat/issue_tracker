import prisma from '@/prisma/client';

type CreateNotificationInput = {
  userId: string;
  issueId: string;
  type: string;
  message: string;
};

export async function createNotifications(items: CreateNotificationInput[]) {
  if (items.length === 0) return;

  await prisma.notification.createMany({
    data: items,
  });
}
