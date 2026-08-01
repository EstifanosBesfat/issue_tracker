import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@ethio/database';
import * as bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../common/types/auth-user.type';
import {
  buildResetPasswordUrl,
  generateResetToken,
  getResetTokenExpiry,
  hashResetToken,
} from '../common/utils/password-reset.util';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const SUCCESS_RESET_MESSAGE =
  'If an account exists for that email, we sent a password reset link.';

@Injectable()
export class AuthService {
  private readonly resend: Resend | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email,
        password: passwordHash,
        role: Role.USER,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
      },
    });

    const accessToken = this.signToken(user);
    return { accessToken, user };
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase();

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.password || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.image,
      createdAt: user.createdAt,
    };

    const accessToken = this.signToken(safeUser);
    return { accessToken, user: safeUser };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user?.isActive && user.password) {
      const { rawToken, tokenHash } = generateResetToken();

      await this.prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      });

      await this.prisma.passwordResetToken.create({
        data: {
          tokenHash,
          userId: user.id,
          expiresAt: getResetTokenExpiry(),
        },
      });

      const resetUrl = buildResetPasswordUrl(rawToken);
      await this.sendPasswordResetEmail(user.email, user.name, resetUrl);
    }

    return { message: SUCCESS_RESET_MESSAGE };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = hashResetToken(dto.token);

    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (!record.user.isActive) {
      throw new BadRequestException('Account is inactive');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: record.userId },
        data: { password: passwordHash },
      });

      await tx.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      });
    });

    return { message: 'Password reset successfully' };
  }

  private signToken(user: { id: string; email: string; role: Role }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  private async sendPasswordResetEmail(
    to: string,
    name: string | null,
    resetUrl: string,
  ) {
    const from =
      this.configService.get<string>('RESEND_FROM') ??
      'EthioTelecom PM <onboarding@resend.dev>';

    if (!this.resend) {
      console.log(`[password-reset] No RESEND_API_KEY — reset link for ${to}: ${resetUrl}`);
      return;
    }

    try {
      await this.resend.emails.send({
        from,
        to,
        subject: 'Reset your password',
        html: `
          <p>Hi ${name ?? 'there'},</p>
          <p>Click the link below to reset your password. This link expires in 15 minutes.</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
        `,
      });
    } catch (error) {
      console.error('[password-reset] email error:', error);
      console.log(`[password-reset] fallback link for ${to}: ${resetUrl}`);
    }
  }
}
