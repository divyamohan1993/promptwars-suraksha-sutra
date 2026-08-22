import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { FirebaseAuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { requireAuthenticatedUser } from '../auth/auth.types';
import { LearningService } from './learning.service';

@UseGuards(FirebaseAuthGuard)
@Controller()
export class LearningController {
  public constructor(@Inject(LearningService) private readonly learning: LearningService) {}

  @Post('session/bootstrap')
  public bootstrap(@Req() request: AuthenticatedRequest, @Body() body: unknown): Promise<unknown> {
    return this.learning.bootstrap(
      requireAuthenticatedUser(request),
      body,
      request.traceId ?? 'unavailable',
    );
  }

  @Get('profiles/:profileId')
  public profile(
    @Req() request: AuthenticatedRequest,
    @Param('profileId') profileId: string,
  ): Promise<unknown> {
    return this.learning.getProfile(requireAuthenticatedUser(request), profileId);
  }

  @Get('profile')
  public compactProfile(
    @Req() request: AuthenticatedRequest,
    @Query('profileId') profileId: string,
  ): Promise<unknown> {
    return this.learning.getProfile(requireAuthenticatedUser(request), profileId);
  }

  @Put('profiles/:profileId/constitution')
  public constitution(
    @Req() request: AuthenticatedRequest,
    @Param('profileId') profileId: string,
    @Body() body: unknown,
  ): Promise<unknown> {
    return this.learning.updateConstitution(
      requireAuthenticatedUser(request),
      profileId,
      body,
      request.traceId ?? 'unavailable',
    );
  }

  @Put('constitution')
  public compactConstitution(
    @Req() request: AuthenticatedRequest,
    @Body() body: Record<string, unknown>,
  ): Promise<unknown> {
    const profileId = readProfileId(body);
    return this.learning.updateConstitution(
      requireAuthenticatedUser(request),
      profileId,
      body['constitution'] ?? body,
      request.traceId ?? 'unavailable',
    );
  }

  @Post('profiles/:profileId/diagnostic')
  public diagnostic(
    @Req() request: AuthenticatedRequest,
    @Param('profileId') profileId: string,
    @Body() body: unknown,
  ): Promise<unknown> {
    return this.learning.diagnostic(
      requireAuthenticatedUser(request),
      profileId,
      body,
      request.traceId ?? 'unavailable',
    );
  }

  @Post('diagnostic')
  public compactDiagnostic(
    @Req() request: AuthenticatedRequest,
    @Body() body: Record<string, unknown>,
  ): Promise<unknown> {
    const profileId = readProfileId(body);
    return this.learning.diagnostic(
      requireAuthenticatedUser(request),
      profileId,
      omitProfileId(body),
      request.traceId ?? 'unavailable',
    );
  }

  @Post('profiles/:profileId/explanation')
  public explanation(
    @Req() request: AuthenticatedRequest,
    @Param('profileId') profileId: string,
    @Body() body: unknown,
  ): Promise<unknown> {
    return this.learning.explanation(
      requireAuthenticatedUser(request),
      profileId,
      body,
      request.traceId ?? 'unavailable',
    );
  }

  @Post('explanation')
  public compactExplanation(
    @Req() request: AuthenticatedRequest,
    @Body() body: Record<string, unknown>,
  ): Promise<unknown> {
    const profileId = readProfileId(body);
    return this.learning.explanation(
      requireAuthenticatedUser(request),
      profileId,
      omitProfileId(body),
      request.traceId ?? 'unavailable',
    );
  }

  @Post('profiles/:profileId/scenario')
  public scenario(
    @Req() request: AuthenticatedRequest,
    @Param('profileId') profileId: string,
    @Body() body: unknown,
  ): Promise<unknown> {
    return this.learning.scenario(
      requireAuthenticatedUser(request),
      profileId,
      body,
      request.traceId ?? 'unavailable',
    );
  }

  @Post('scenario')
  public compactScenario(
    @Req() request: AuthenticatedRequest,
    @Body() body: Record<string, unknown>,
  ): Promise<unknown> {
    const profileId = readProfileId(body);
    return this.learning.scenario(
      requireAuthenticatedUser(request),
      profileId,
      omitProfileId(body),
      request.traceId ?? 'unavailable',
    );
  }

  @Post('profiles/:profileId/teach-back')
  public teachBack(
    @Req() request: AuthenticatedRequest,
    @Param('profileId') profileId: string,
    @Body() body: unknown,
  ): Promise<unknown> {
    return this.learning.teachBack(
      requireAuthenticatedUser(request),
      profileId,
      body,
      request.traceId ?? 'unavailable',
    );
  }

  @Post('teach-back')
  public compactTeachBack(
    @Req() request: AuthenticatedRequest,
    @Body() body: Record<string, unknown>,
  ): Promise<unknown> {
    const profileId = readProfileId(body);
    return this.learning.teachBack(
      requireAuthenticatedUser(request),
      profileId,
      omitProfileId(body),
      request.traceId ?? 'unavailable',
    );
  }

  @Get('profiles/:profileId/dashboard')
  public dashboard(
    @Req() request: AuthenticatedRequest,
    @Param('profileId') profileId: string,
  ): Promise<unknown> {
    return this.learning.dashboard(
      requireAuthenticatedUser(request),
      profileId,
      request.traceId ?? 'unavailable',
    );
  }

  @Get('dashboard')
  public compactDashboard(
    @Req() request: AuthenticatedRequest,
    @Query('profileId') profileId: string,
  ): Promise<unknown> {
    return this.learning.dashboard(
      requireAuthenticatedUser(request),
      profileId,
      request.traceId ?? 'unavailable',
    );
  }

  @Post('evaluator/reset')
  public reset(@Req() request: AuthenticatedRequest): Promise<unknown> {
    return this.learning.resetEvaluator(
      requireAuthenticatedUser(request),
      request.traceId ?? 'unavailable',
    );
  }
}

function readProfileId(body: Record<string, unknown>): string {
  const value = body['profileId'];
  if (typeof value !== 'string' || value.trim().length === 0)
    throw new Error('profileId is required.');
  return value;
}

function omitProfileId(body: Record<string, unknown>): Record<string, unknown> {
  const { profileId: _profileId, ...rest } = body;
  return rest;
}
