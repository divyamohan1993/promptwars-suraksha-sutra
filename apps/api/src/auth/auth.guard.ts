import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { FirebaseAdminService } from './firebase-admin.service';
import type { AuthenticatedRequest } from './auth.types';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  public constructor(
    @Inject(FirebaseAdminService) private readonly firebase: FirebaseAdminService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    const token = Array.isArray(header) ? header[0] : header;
    if (!token?.startsWith('Bearer ')) {
      throw new UnauthorizedException('A Firebase Bearer token is required.');
    }
    const rawToken = token.slice('Bearer '.length).trim();
    if (!rawToken || rawToken.length > 8_192) {
      throw new UnauthorizedException('A Firebase Bearer token is required.');
    }
    request.authUser = await this.firebase.verifyBearerToken(rawToken);
    return true;
  }
}
