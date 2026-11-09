import { Body, Controller, Delete, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TeacherGuard } from '../auth/teacher.guard';
import { TeacherService } from './teacher.service';

@UseGuards(JwtAuthGuard, TeacherGuard)
@Controller('content')
export class TeacherController {
  constructor(private readonly t: TeacherService) {}

  @Post('modules')
  createModule(@Request() r: any, @Body() b: any) { return this.t.createModule(r.user.id, b); }

  @Patch('modules/:id')
  updateModule(@Request() r: any, @Param('id') id: string, @Body() b: any) { return this.t.updateModule(r.user.id, id, b); }

  @Delete('modules/:id')
  deleteModule(@Request() r: any, @Param('id') id: string) { return this.t.deleteModule(r.user.id, id); }

  @Post('modules/:id/lessons')
  createLesson(@Request() r: any, @Param('id') id: string, @Body() b: any) { return this.t.createLesson(r.user.id, id, b); }

  @Patch('lessons/:id')
  updateLesson(@Request() r: any, @Param('id') id: string, @Body() b: any) { return this.t.updateLesson(r.user.id, id, b); }

  @Delete('lessons/:id')
  deleteLesson(@Request() r: any, @Param('id') id: string) { return this.t.deleteLesson(r.user.id, id); }

  @Post('lessons/:id/challenges')
  createChallenge(@Request() r: any, @Param('id') id: string, @Body() b: any) { return this.t.createChallenge(r.user.id, id, b); }

  @Patch('challenges/:id')
  updateChallenge(@Request() r: any, @Param('id') id: string, @Body() b: any) { return this.t.updateChallenge(r.user.id, id, b); }

  @Delete('challenges/:id')
  deleteChallenge(@Request() r: any, @Param('id') id: string) { return this.t.deleteChallenge(r.user.id, id); }
}
