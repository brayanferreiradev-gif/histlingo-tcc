import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('leaderboard')
  getLeaderboard() {
    return this.usersService.getLeaderboard();
  }

  @Get('progress')
  getProgress(@Request() req: any) {
    return this.usersService.getProgress(req.user.id);
  }

  @Get('topic-stats')
  getTopicStats(@Request() req: any) {
    return this.usersService.getTopicStats(req.user.id);
  }

  @Patch('profile')
  updateProfile(@Request() req: any, @Body() dto: { username?: string; avatarEmoji?: string }) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Post(':id/complete-lesson')
  completeLesson(@Param('id') userId: string, @Body() body: { lessonId: string; wrongCount?: number }) {
    return this.usersService.completeLesson(userId, body.lessonId, body.wrongCount ?? 0);
  }

  @Post(':id/streak/update')
  updateStreak(@Param('id') id: string) {
    return this.usersService.updateStreak(id);
  }

  @Post(':id/answer')
  submitAnswer(@Param('id') id: string, @Body() body: { challengeId: string; quality: number }) {
    return this.usersService.submitAnswer(id, body.challengeId, body.quality);
  }
}
