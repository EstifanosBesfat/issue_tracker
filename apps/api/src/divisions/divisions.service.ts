import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDivisionDto, UpdateDivisionDto } from './dto/division.dto';

@Injectable()
export class DivisionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.division.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const division = await this.prisma.division.findUnique({ where: { id } });
    if (!division) {
      throw new NotFoundException('Division not found');
    }
    return division;
  }

  async create(dto: CreateDivisionDto) {
    const existing = await this.prisma.division.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Division name already exists');
    }

    return this.prisma.division.create({
      data: {
        name: dto.name,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateDivisionDto) {
    await this.findOne(id);

    if (dto.name) {
      const existing = await this.prisma.division.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException('Division name already exists');
      }
    }

    return this.prisma.division.update({
      where: { id },
      data: {
        name: dto.name,
        isActive: dto.isActive,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.division.delete({ where: { id } });
    return { message: 'Division deleted' };
  }
}
