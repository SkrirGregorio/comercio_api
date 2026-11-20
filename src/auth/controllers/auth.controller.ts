import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import {
  CreateUsuarioDto,
  UpdateUsuarioDto,
} from '../../usuarios/dto/create-usuario.dto';
import type { Request } from 'express';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { Public } from '../decorators/public.decorator';
import { GetUser } from '../decorators/get-user.decorator';
import { Usuario } from '../../usuarios/entities/usuario.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() userDto: CreateUsuarioDto) {
    return this.authService.register(userDto);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Req() req: Request & { user: any }) {
    return this.authService.login(req.user);
  }

  @Post('update')
  async updateProfile(
    @Body() updateProfileDto: UpdateUsuarioDto,
    @GetUser() user: Usuario,
  ) {
    console.log('UpdateUsuarioDto received in controller:', updateProfileDto);
    return this.authService.updateProfile(user.id, updateProfileDto);
  }

  @Get('profile')
  async getProfile(@GetUser() user: any) {
    return this.authService.getProfile(user.userId);
  }
}
