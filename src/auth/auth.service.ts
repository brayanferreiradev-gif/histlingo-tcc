import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private db: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.db.queryOne(
      'SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1',
      [dto.email, dto.username]
    );
    if (existing) throw new ConflictException('Email ou nome de usuário já em uso.');

    // Cadastro de professor: exige o código de acesso (TEACHER_CODE no servidor).
    let role = 'STUDENT';
    if (dto.teacherCode) {
      const expected = process.env.TEACHER_CODE || 'professor-histlingo';
      const a = Buffer.from(dto.teacherCode);
      const b = Buffer.from(expected);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        throw new BadRequestException('Código de professor inválido.');
      }
      role = 'ADMIN';
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const id = crypto.randomUUID();
    await this.db.run(
      'INSERT INTO users (id, username, email, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [id, dto.username, dto.email, hashed, role]
    );
    return this.signToken(id, dto.email);
  }

  async login(dto: LoginDto) {
    const user = await this.db.queryOne<{ id: string; email: string; password: string }>(
      'SELECT id, email, password FROM users WHERE email = ? LIMIT 1',
      [dto.email]
    );
    if (!user) throw new UnauthorizedException('Credenciais inválidas.');
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciais inválidas.');
    return this.signToken(user.id, user.email);
  }

  async getMe(userId: string) {
    return this.db.queryOne(
      `SELECT id, username, email, role, xp_total as xpTotal, level, streak_count as streakCount,
              last_activity_date as lastActivityDate, created_at as createdAt, avatar_emoji as avatarEmoji
       FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );
  }

  async forgotPassword(email: string) {
    const user = await this.db.queryOne<{ id: string; username: string; email: string }>(
      'SELECT id, username, email FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    if (!user) return { message: 'Se o email existir, você receberá as instruções em breve.' };

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000);
    await this.db.run(
      'UPDATE users SET password_reset_token = ?, password_reset_expires = ?, updated_at = NOW() WHERE id = ?',
      [token, expires, user.id]
    );

    const baseUrl = process.env.FRONTEND_URL || 'https://histlingo.com.br';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    await this.sendResetEmail(user.email, user.username, resetUrl);
    return { message: 'Se o email existir, você receberá as instruções em breve.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.db.queryOne<{ id: string }>(
      'SELECT id FROM users WHERE password_reset_token = ? AND password_reset_expires > NOW() LIMIT 1',
      [token]
    );
    if (!user) throw new BadRequestException('Link de recuperação inválido ou expirado. Solicite um novo.');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.db.run(
      'UPDATE users SET password = ?, password_reset_token = NULL, password_reset_expires = NULL, updated_at = NOW() WHERE id = ?',
      [hashed, user.id]
    );
    return { message: 'Senha atualizada com sucesso! Faça login.' };
  }

  private async sendResetEmail(to: string, username: string, resetUrl: string) {
    if (!process.env.SMTP_HOST) {
      console.log(`[HistLingo] Reset de senha para ${to}: ${resetUrl}`);
      return;
    }
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"HistLingo" <noreply@histlingo.com>',
      to,
      subject: '🏹 HistLingo — Recuperação de Senha',
      html: `
        <div style="background:#0A1118;color:#fff;padding:40px;font-family:sans-serif;max-width:500px;margin:0 auto;border-radius:16px;">
          <h1 style="color:#00A651;">🏹 HistLingo</h1>
          <p>Olá, <strong>${username}</strong>!</p>
          <p>Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo:</p>
          <a href="${resetUrl}" style="display:inline-block;background:#00A651;color:#fff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:bold;margin:20px 0;">
            REDEFINIR SENHA
          </a>
          <p style="color:#888;font-size:13px;">Este link expira em 1 hora. Se você não solicitou, ignore este email.</p>
        </div>
      `,
    });
  }

  private signToken(userId: string, email: string) {
    return { access_token: this.jwt.sign({ sub: userId, email }) };
  }
}
