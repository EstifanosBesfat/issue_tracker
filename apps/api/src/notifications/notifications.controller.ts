import {
  Body,
  Controller,
  Get,
  MessageEvent,
  Patch,
  Sse,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/types/auth-user.type';
import { MarkNotificationsDto } from './dto/mark-notifications.dto';
import { NotificationBusService } from './notification-bus.service';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly notificationBus: NotificationBusService,
  ) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.notificationsService.findAll(user.id);
  }

  @Patch()
  markRead(@CurrentUser() user: AuthUser, @Body() dto: MarkNotificationsDto) {
    return this.notificationsService.markRead(user.id, dto);
  }

  @Sse('stream')
  stream(@CurrentUser() user: AuthUser): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      subscriber.next({ type: 'connected', data: { userId: user.id } });

      const unsubscribe = this.notificationBus.subscribe(
        user.id,
        ({ event, data }) => {
          subscriber.next({ type: event, data: data as object });
        },
      );

      const heartbeat = setInterval(() => {
        subscriber.next({ type: 'heartbeat', data: { ts: Date.now() } });
      }, 30000);

      return () => {
        clearInterval(heartbeat);
        unsubscribe();
      };
    });
  }
}
