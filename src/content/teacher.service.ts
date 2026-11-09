import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

/** Área do professor: criar e editar matérias, lições e perguntas. */
@Injectable()
export class TeacherService {
  constructor(private db: PrismaService) {}

  private async assertModuleEditable(moduleId: string, userId: string) {
    const m = await this.db.queryOne<{ id: string; owner_id: string | null }>(
      'SELECT id, owner_id FROM modules WHERE id = ? LIMIT 1', [moduleId]);
    if (!m) throw new NotFoundException('Matéria não encontrada.');
    if (m.owner_id && m.owner_id !== userId) throw new ForbiddenException('Esta matéria pertence a outro professor.');
    return m;
  }

  private async moduleIdOfLesson(lessonId: string) {
    const l = await this.db.queryOne<{ module_id: string }>('SELECT module_id FROM lessons WHERE id = ? LIMIT 1', [lessonId]);
    if (!l) throw new NotFoundException('Lição não encontrada.');
    return l.module_id;
  }

  private async moduleIdOfChallenge(id: string) {
    const r = await this.db.queryOne<{ lesson_id: string }>('SELECT lesson_id FROM challenges WHERE id = ? LIMIT 1', [id]);
    if (!r) throw new NotFoundException('Pergunta não encontrada.');
    return this.moduleIdOfLesson(r.lesson_id);
  }

  async createModule(userId: string, dto: { title: string; description?: string }) {
    const title = (dto.title ?? '').trim();
    if (!title) throw new BadRequestException('Informe o título da matéria.');
    const id = crypto.randomUUID();
    const row = await this.db.queryOne<{ n: number }>('SELECT COALESCE(MAX(`order`), 0) + 1 AS n FROM modules');
    await this.db.run(
      'INSERT INTO modules (id, `order`, title, description, owner_id) VALUES (?, ?, ?, ?, ?)',
      [id, Number(row?.n ?? 1), title.slice(0, 120), (dto.description ?? '').slice(0, 500), userId]);
    return { id };
  }

  async updateModule(userId: string, id: string, dto: { title?: string; description?: string }) {
    await this.assertModuleEditable(id, userId);
    if (dto.title !== undefined && !dto.title.trim()) throw new BadRequestException('Título vazio.');
    await this.db.run(
      'UPDATE modules SET title = COALESCE(?, title), description = COALESCE(?, description) WHERE id = ?',
      [dto.title?.trim().slice(0, 120) ?? null, dto.description?.slice(0, 500) ?? null, id]);
    return { ok: true };
  }

  async deleteModule(userId: string, id: string) {
    const m = await this.assertModuleEditable(id, userId);
    if (!m.owner_id) throw new ForbiddenException('Matérias padrão do app não podem ser apagadas.');
    const lessons = await this.db.query<{ id: string }>('SELECT id FROM lessons WHERE module_id = ?', [id]);
    for (const l of lessons) await this.removeLesson(l.id);
    await this.db.run('DELETE FROM modules WHERE id = ?', [id]);
    return { ok: true };
  }

  private async removeLesson(lessonId: string) {
    const ch = 'SELECT id FROM challenges WHERE lesson_id = ?';
    await this.db.run(`DELETE FROM answers WHERE challenge_id IN (${ch})`, [lessonId]);
    await this.db.run(`DELETE FROM user_reviews WHERE challenge_id IN (${ch})`, [lessonId]);
    await this.db.run('DELETE FROM challenges WHERE lesson_id = ?', [lessonId]);
    await this.db.run('DELETE FROM user_progress WHERE lesson_id = ?', [lessonId]);
    await this.db.run('DELETE FROM lessons WHERE id = ?', [lessonId]);
  }

  private xp(v: unknown) {
    return Math.min(100, Math.max(5, Math.round(Number(v) || 15)));
  }

  async createLesson(userId: string, moduleId: string, dto: { title: string; content: string; xpReward?: number }) {
    await this.assertModuleEditable(moduleId, userId);
    const title = (dto.title ?? '').trim();
    if (!title) throw new BadRequestException('Informe o título da lição.');
    const id = crypto.randomUUID();
    const row = await this.db.queryOne<{ n: number }>('SELECT COALESCE(MAX(`order`), 0) + 1 AS n FROM lessons WHERE module_id = ?', [moduleId]);
    await this.db.run(
      'INSERT INTO lessons (id, module_id, title, content, xp_reward, `order`) VALUES (?, ?, ?, ?, ?, ?)',
      [id, moduleId, title.slice(0, 160), (dto.content ?? '').slice(0, 8000), this.xp(dto.xpReward), Number(row?.n ?? 1)]);
    return { id };
  }

  async updateLesson(userId: string, id: string, dto: { title?: string; content?: string; xpReward?: number }) {
    await this.assertModuleEditable(await this.moduleIdOfLesson(id), userId);
    await this.db.run(
      'UPDATE lessons SET title = COALESCE(?, title), content = COALESCE(?, content), xp_reward = COALESCE(?, xp_reward) WHERE id = ?',
      [dto.title?.trim().slice(0, 160) ?? null, dto.content?.slice(0, 8000) ?? null,
       dto.xpReward === undefined ? null : this.xp(dto.xpReward), id]);
    return { ok: true };
  }

  async deleteLesson(userId: string, id: string) {
    await this.assertModuleEditable(await this.moduleIdOfLesson(id), userId);
    await this.removeLesson(id);
    return { ok: true };
  }

  private cleanChallenge(dto: { type?: string; content?: string; options?: string[]; correctAnswer?: string; explanation?: string }) {
    const types = ['WHO_AM_I', 'WORKS_AND_RELICS', 'TIMELINE', 'DECISION_SCENARIO'];
    const type = types.includes(dto.type ?? '') ? dto.type! : 'WORKS_AND_RELICS';
    const options = (dto.options ?? []).map((o) => String(o).trim()).filter(Boolean).slice(0, 6);
    const content = (dto.content ?? '').trim();
    const correct = (dto.correctAnswer ?? '').trim();
    if (!content) throw new BadRequestException('Escreva o enunciado da pergunta.');
    if (options.length < 2) throw new BadRequestException('Informe pelo menos 2 alternativas.');
    if (!options.includes(correct)) throw new BadRequestException('A resposta correta precisa ser uma das alternativas.');
    return { type, options, content: content.slice(0, 1500), correct, explanation: (dto.explanation ?? '').slice(0, 800) };
  }

  async createChallenge(userId: string, lessonId: string, dto: any) {
    await this.assertModuleEditable(await this.moduleIdOfLesson(lessonId), userId);
    const c = this.cleanChallenge(dto);
    const id = crypto.randomUUID();
    await this.db.run(
      'INSERT INTO challenges (id, lesson_id, type, content, options, correct_answer, explanation, difficulty_weight) VALUES (?, ?, ?, ?, ?, ?, ?, 1.0)',
      [id, lessonId, c.type, c.content, JSON.stringify(c.options), c.correct, c.explanation]);
    return { id };
  }

  async updateChallenge(userId: string, id: string, dto: any) {
    await this.assertModuleEditable(await this.moduleIdOfChallenge(id), userId);
    const c = this.cleanChallenge(dto);
    await this.db.run(
      'UPDATE challenges SET type = ?, content = ?, options = ?, correct_answer = ?, explanation = ? WHERE id = ?',
      [c.type, c.content, JSON.stringify(c.options), c.correct, c.explanation, id]);
    return { ok: true };
  }

  async deleteChallenge(userId: string, id: string) {
    await this.assertModuleEditable(await this.moduleIdOfChallenge(id), userId);
    await this.db.run('DELETE FROM answers WHERE challenge_id = ?', [id]);
    await this.db.run('DELETE FROM user_reviews WHERE challenge_id = ?', [id]);
    await this.db.run('DELETE FROM challenges WHERE id = ?', [id]);
    return { ok: true };
  }
}
