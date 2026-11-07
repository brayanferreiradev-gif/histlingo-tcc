import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { SrsService } from '../srs/srs.service';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    private db: PrismaService,
    private gamification: GamificationService,
    private srs: SrsService,
  ) {}

  async findAll() {
    return this.db.query(
      'SELECT id, username, email, role, xp_total as xpTotal, level FROM users'
    );
  }

  async findOne(id: string) {
    return this.db.queryOne('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
  }

  async updateStreak(id: string) {
    return this.gamification.updateStreak(id);
  }

  async updateProfile(userId: string, dto: { username?: string; avatarEmoji?: string }) {
    if (dto.username) {
      const existing = await this.db.queryOne(
        'SELECT id FROM users WHERE username = ? AND id != ? LIMIT 1',
        [dto.username, userId]
      );
      if (existing) throw new ConflictException('Nome de usuário já em uso.');
    }
    const sets: string[] = [];
    const vals: any[] = [];
    if (dto.username !== undefined) { sets.push('username = ?'); vals.push(dto.username); }
    if (dto.avatarEmoji !== undefined) { sets.push('avatar_emoji = ?'); vals.push(dto.avatarEmoji); }
    if (sets.length) {
      sets.push('updated_at = NOW()');
      vals.push(userId);
      await this.db.run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, vals);
    }
    return this.db.queryOne(
      'SELECT id, username, xp_total as xpTotal, level, streak_count as streakCount, avatar_emoji as avatarEmoji, email FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
  }

  async getLeaderboard() {
    const users = await this.db.query<{
      id: string; username: string; xp_total: number; level: number; streak_count: number; avatar_emoji: string;
    }>(
      'SELECT id, username, xp_total, level, streak_count, avatar_emoji FROM users ORDER BY xp_total DESC, level DESC, created_at ASC LIMIT 20'
    );
    return users.map((u, i) => ({
      id: u.id,
      username: u.username,
      xpTotal: u.xp_total,
      level: u.level,
      streakCount: u.streak_count,
      avatarEmoji: u.avatar_emoji,
      rank: i + 1,
      league: this.getLeague(u.xp_total),
    }));
  }

  async getProgress(userId: string) {
    const rows = await this.db.query<{ lesson_id: string }>(
      'SELECT lesson_id FROM user_progress WHERE user_id = ? AND completed = 1',
      [userId]
    );
    return rows.map(r => r.lesson_id);
  }

  async completeLesson(userId: string, lessonId: string, wrongCount: number = 0) {
    const lesson = await this.db.queryOne<{ id: string; xp_reward: number }>(
      'SELECT id, xp_reward FROM lessons WHERE id = ? LIMIT 1',
      [lessonId]
    );
    if (!lesson) throw new NotFoundException('Lição não encontrada.');

    const already = await this.db.queryOne<{ completed: number }>(
      'SELECT completed FROM user_progress WHERE user_id = ? AND lesson_id = ? LIMIT 1',
      [userId, lessonId]
    );

    if (!already) {
      const id = crypto.randomUUID();
      await this.db.run(
        'INSERT INTO user_progress (id, user_id, lesson_id, completed, updated_at) VALUES (?, ?, ?, 1, NOW())',
        [id, userId, lessonId]
      );
    } else {
      await this.db.run(
        'UPDATE user_progress SET completed = 1, updated_at = NOW() WHERE user_id = ? AND lesson_id = ?',
        [userId, lessonId]
      );
    }

    if (!already?.completed) {
      const multiplier = Math.max(0.5, 1 - wrongCount * 0.15);
      const xpGranted = Math.round(lesson.xp_reward * multiplier);
      await this.gamification.addXP(userId, xpGranted);
      await this.gamification.updateStreak(userId);
      return { xpGained: xpGranted, firstTime: true };
    }
    return { xpGained: 0, firstTime: false };
  }

  async submitAnswer(userId: string, challengeId: string, quality: number) {
    const challenge = await this.db.queryOne<{ id: string; difficulty_weight: number }>(
      'SELECT id, difficulty_weight FROM challenges WHERE id = ? LIMIT 1',
      [challengeId]
    );
    if (!challenge) throw new NotFoundException('Desafio não encontrado.');

    const existingReview = await this.db.queryOne<{
      id: string; ease_factor: number; interval: number; repetitions: number;
    }>(
      'SELECT id, ease_factor, `interval`, repetitions FROM user_reviews WHERE user_id = ? AND challenge_id = ? LIMIT 1',
      [userId, challengeId]
    );

    // registra a resposta para as estatísticas por assunto (medalhas)
    await this.db.run(
      'INSERT INTO answers (id, user_id, challenge_id, answer_provided, is_correct, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [crypto.randomUUID(), userId, challengeId, '', quality >= 4 ? 1 : 0]
    );

    const srsData = this.srs.calculateNextReview(existingReview ? {
      easeFactor: existingReview.ease_factor,
      interval: existingReview.interval,
      repetitions: existingReview.repetitions,
    } : {}, quality);

    if (existingReview) {
      await this.db.run(
        'UPDATE user_reviews SET ease_factor = ?, `interval` = ?, repetitions = ?, next_review_date = ? WHERE id = ?',
        [srsData.easeFactor, srsData.interval, srsData.repetitions, srsData.nextReviewDate, existingReview.id]
      );
    } else {
      const id = crypto.randomUUID();
      await this.db.run(
        'INSERT INTO user_reviews (id, user_id, challenge_id, ease_factor, `interval`, repetitions, next_review_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
        [id, userId, challengeId, srsData.easeFactor, srsData.interval, srsData.repetitions, srsData.nextReviewDate]
      );
    }

    const user = await this.db.queryOne<{ streak_count: number }>(
      'SELECT streak_count FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
    const xpGain = this.gamification.calculateXPGain(10, challenge.difficulty_weight, user?.streak_count ?? 0);
    await this.gamification.addXP(userId, xpGain);

    return { xpGain, nextReviewDate: srsData.nextReviewDate };
  }

  /** Acertos por assunto (módulo), usados para as medalhas 3D. */
  async getTopicStats(userId: string) {
    const rows = await this.db.query<{
      moduleId: string; moduleOrder: number; title: string; total: number; correct: number;
    }>(
      `SELECT m.id AS moduleId, m.\`order\` AS moduleOrder, m.title AS title,
              COUNT(*) AS total, COALESCE(SUM(a.is_correct), 0) AS correct
         FROM answers a
         JOIN challenges c ON c.id = a.challenge_id
         JOIN lessons l ON l.id = c.lesson_id
         JOIN modules m ON m.id = l.module_id
        WHERE a.user_id = ?
        GROUP BY m.id, m.\`order\`, m.title
        ORDER BY m.\`order\``,
      [userId]
    );
    return rows.map((r) => ({
      moduleId: r.moduleId,
      order: Number(r.moduleOrder),
      title: r.title,
      total: Number(r.total),
      correct: Number(r.correct),
    }));
  }

  private getLeague(xp: number): string {
    if (xp >= 10000) return 'Mestre';
    if (xp >= 5000) return 'Diamante';
    if (xp >= 2000) return 'Ouro';
    if (xp >= 500) return 'Prata';
    return 'Bronze';
  }
}
