import { Module } from '@nestjs/common';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [ContentService, TeacherService],
  controllers: [ContentController, TeacherController],
})
export class ContentModule {}
