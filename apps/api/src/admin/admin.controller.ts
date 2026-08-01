import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@ethio/database';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUser } from '../common/types/auth-user.type';
import { AdminService } from './admin.service';
import { BulkUpdateTaskStatusDto } from './dto/bulk-update-task-status.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@UseGuards(RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Patch('tasks/bulk-status')
  bulkUpdateTaskStatus(
    @Body() dto: BulkUpdateTaskStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.adminService.bulkUpdateTaskStatus(dto, user);
  }
}
