import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@ethio/database';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../types/auth-user.type';

@Injectable()
export class ProjectMemberGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      Request & { user: AuthUser; projectMembership?: { role: string } }
    >();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Forbidden');
    }

    if (user.role === Role.ADMIN) {
      return true;
    }

    const projectId = this.extractProjectId(request);
    if (!projectId) {
      throw new ForbiddenException('Project id is required');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const membership = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: user.id },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this project');
    }

    request.projectMembership = membership;
    return true;
  }

  private extractProjectId(request: Request): string | undefined {
    const params = request.params as Record<string, string>;
    return params.projectId ?? params.id;
  }
}
