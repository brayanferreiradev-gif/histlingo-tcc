import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

/** Libera só contas de professor (role ADMIN). Use depois do JwtAuthGuard. */
@Injectable()
export class TeacherGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const user = ctx.switchToHttp().getRequest().user;
    if (user?.role !== 'ADMIN') throw new ForbiddenException('Apenas professores.');
    return true;
  }
}
