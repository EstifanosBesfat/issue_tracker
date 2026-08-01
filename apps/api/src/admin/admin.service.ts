import { Injectable } from '@nestjs/common';
import { TaskStatus } from '@ethio/database';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/types/auth-user.type';
import { ProjectCompletionService } from '../projects/project-completion.service';
import { BulkUpdateTaskStatusDto } from './dto/bulk-update-task-status.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectCompletion: ProjectCompletionService,
  ) {}

  async bulkUpdateTaskStatus(dto: BulkUpdateTaskStatusDto, user: AuthUser) {
    const tasks = await this.prisma.task.findMany({
      where: { id: { in: dto.taskIds } },
      select: { id: true, projectId: true },
    });

    const result = await this.prisma.task.updateMany({
      where: { id: { in: dto.taskIds } },
      data: { status: dto.status },
    });

    const projectIds = [...new Set(tasks.map((task) => task.projectId))];

    for (const projectId of projectIds) {
      await this.projectCompletion.syncProjectCompletion(projectId, user.id);
    }

    return {
      updated: result.count,
      projectIds,
    };
  }
}
