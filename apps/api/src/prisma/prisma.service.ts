import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPrismaClient, Prisma, PrismaClient } from '@ethio/database';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly prisma: PrismaClient;

  constructor(configService: ConfigService) {
    this.prisma = createPrismaClient(configService.get<string>('DATABASE_URL'));
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  get user() {
    return this.prisma.user;
  }

  get project() {
    return this.prisma.project;
  }

  get projectMember() {
    return this.prisma.projectMember;
  }

  get task() {
    return this.prisma.task;
  }

  get division() {
    return this.prisma.division;
  }

  get taskImage() {
    return this.prisma.taskImage;
  }

  get comment() {
    return this.prisma.comment;
  }

  get activityLog() {
    return this.prisma.activityLog;
  }

  get notification() {
    return this.prisma.notification;
  }

  get passwordResetToken() {
    return this.prisma.passwordResetToken;
  }

  $transaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    options?: Parameters<PrismaClient['$transaction']>[1],
  ) {
    return this.prisma.$transaction(fn, options);
  }
}
