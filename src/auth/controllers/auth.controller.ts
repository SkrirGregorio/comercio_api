import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from '../services/auth.service';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { Public } from '../decorators/public.decorator';
import { GetUser } from '../decorators/get-user.decorator';
import { RegisterDto } from '../dtos/register.dto';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import type { JwtUser } from '../strategies/jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Límite estricto contra creación masiva de cuentas
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // Límite estricto contra fuerza bruta de contraseñas
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Public()
  @UseGuards(LocalAuthGuard)
  @HttpCode(200)
  @Post('login')
  login(@Req() req: Request & { user: any }) {
    return this.authService.login(req.user);
  }

  @Post('update')
  updateProfile(@Body() dto: UpdateProfileDto, @GetUser() user: JwtUser) {
    return this.authService.updateProfile(user.userId, dto);
  }

  @Get('profile')
  getProfile(@GetUser() user: JwtUser) {
    return this.authService.getProfile(user.userId);
  }
}
