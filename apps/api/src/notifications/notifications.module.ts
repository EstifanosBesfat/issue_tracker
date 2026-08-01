import { Module } from '@nestjs/common';
import { NotificationBusService } from './notification-bus.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationBusService],
  exports: [NotificationBusService, NotificationsService],
})
export class NotificationsModule {}
