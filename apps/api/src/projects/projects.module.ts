import { Module } from '@nestjs/common';
import { ProjectCompletionService } from './project-completion.service';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectCompletionService],
  exports: [ProjectsService, ProjectCompletionService],
})
export class ProjectsModule {}
