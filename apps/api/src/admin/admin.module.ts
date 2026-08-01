import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [ProjectsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
