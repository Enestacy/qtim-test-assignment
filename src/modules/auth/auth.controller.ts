import { Controller, Post, Body, UseGuards, Req, Res, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { AccessTokenGuard } from '../../common/guards/access-token.guard';
import { RefreshTokenGuard } from '../../common/guards/refresh-token.guard';
import { LoginRequest, LoginResponse, RefreshResponse, RegisterRequest, RegisterResponse } from './auth.contracts';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() data: RegisterRequest): Promise<RegisterResponse> {
    return this.authService.register(data);
  }

  @Post('login')
  async login(@Body() payload: LoginRequest): Promise<LoginResponse> {
    return this.authService.login(payload);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  refreshTokens(@Req() req: Request): Promise<RefreshResponse> {
    const userId = req['user']['sub'];
    const refreshToken = req['user']['refreshToken'];

    return this.authService.refreshTokens(userId, refreshToken);
  }

  @UseGuards(AccessTokenGuard)
  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.logout(req['user']['sub']);

    if (!result) {
      res.send().status(HttpStatus.INTERNAL_SERVER_ERROR);
      return;
    }

    res.send().status(HttpStatus.NO_CONTENT);
  }
}
