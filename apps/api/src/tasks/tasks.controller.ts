import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ProjectMemberGuard } from '../common/guards/project-member.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { CreateTaskDto, TaskFiltersDto, UpdateTaskDto } from './dto/task.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('projects/:projectId/tasks')
  @UseGuards(ProjectMemberGuard)
  findByProject(
    @Param('projectId') projectId: string,
    @Query() filters: TaskFiltersDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tasksService.findByProject(projectId, filters, user);
  }

  @Get('projects/:projectId/tasks/export')
  @UseGuards(ProjectMemberGuard)
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="tasks.csv"')
  exportCsv(
    @Param('projectId') projectId: string,
    @Query() filters: TaskFiltersDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tasksService.exportCsv(projectId, filters, user);
  }

  @Post('projects/:projectId/tasks')
  @UseGuards(ProjectMemberGuard)
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tasksService.create(projectId, dto, user);
  }

  @Get('tasks/:id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.tasksService.findOne(id, user);
  }

  @Patch('tasks/:id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tasksService.update(id, dto, user);
  }

  @Delete('tasks/:id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.tasksService.remove(id, user);
  }
}
