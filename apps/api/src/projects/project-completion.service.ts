import { Injectable } from '@nestjs/common';
import { ProjectStatus, TaskStatus } from '@ethio/database';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectCompletionService {
  constructor(private readonly prisma: PrismaService) {}

  async syncProjectCompletion(projectId: string, actorId: string) {
    const [tasks, project] = await Promise.all([
      this.prisma.task.findMany({
        where: { projectId },
        select: { status: true },
      }),
      this.prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, status: true },
      }),
    ]);

    if (!project || tasks.length === 0) {
      return project;
    }

    const allDone = tasks.every((task) => task.status === TaskStatus.DONE);

    if (allDone && project.status !== ProjectStatus.COMPLETED) {
      await this.prisma.project.update({
        where: { id: projectId },
        data: { status: ProjectStatus.COMPLETED },
      });

      await this.prisma.activityLog.create({
        data: {
          projectId,
          actorId,
          action: 'PROJECT_AUTO_COMPLETED',
          oldValue: ProjectStatus.ACTIVE,
          newValue: ProjectStatus.COMPLETED,
        },
      });

      return { ...project, status: ProjectStatus.COMPLETED };
    }

    if (!allDone && project.status === ProjectStatus.COMPLETED) {
      await this.prisma.project.update({
        where: { id: projectId },
        data: { status: ProjectStatus.ACTIVE },
      });

      await this.prisma.activityLog.create({
        data: {
          projectId,
          actorId,
          action: 'PROJECT_REOPENED',
          oldValue: ProjectStatus.COMPLETED,
          newValue: ProjectStatus.ACTIVE,
        },
      });

      return { ...project, status: ProjectStatus.ACTIVE };
    }

    return project;
  }

  async getProjectProgress(projectId: string) {
    const [project, tasks] = await Promise.all([
      this.prisma.project.findUnique({
        where: { id: projectId },
        select: { status: true },
      }),
      this.prisma.task.findMany({
        where: { projectId },
        select: { status: true },
      }),
    ]);

    const total = tasks.length;
    const done = tasks.filter((task) => task.status === TaskStatus.DONE).length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    return {
      total,
      done,
      percent,
      status: project?.status ?? ProjectStatus.ACTIVE,
    };
  }
}
