import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';

type NotificationEvent = {
  userId: string;
  event: string;
  data: unknown;
};

@Injectable()
export class NotificationBusService {
  private readonly emitter = new EventEmitter();

  emitToUser(userId: string, event: string, data: unknown) {
    this.emitter.emit('notification', { userId, event, data } satisfies NotificationEvent);
  }

  subscribe(
    userId: string,
    listener: (payload: { event: string; data: unknown }) => void,
  ) {
    const handler = (payload: NotificationEvent) => {
      if (payload.userId === userId) {
        listener({ event: payload.event, data: payload.data });
      }
    };

    this.emitter.on('notification', handler);

    return () => {
      this.emitter.off('notification', handler);
    };
  }
}
