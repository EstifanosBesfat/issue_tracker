import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MarkNotificationsDto } from './dto/mark-notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(userId: string, dto: MarkNotificationsDto) {
    if (dto.id) {
      const notification = await this.prisma.notification.findFirst({
        where: { id: dto.id, userId },
      });

      if (!notification) {
        throw new NotFoundException('Notification not found');
      }

      return this.prisma.notification.update({
        where: { id: dto.id },
        data: { read: dto.read ?? true },
      });
    }

    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: dto.read ?? true },
    });

    return { message: 'Notifications updated' };
  }
}
