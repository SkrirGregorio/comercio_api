import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '../../usuarios/entities/usuario.entity';

export interface JwtUser {
  userId: number;
  email: string;
  role: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Sin valor por defecto: si falta JWT_SECRET la app no debe arrancar
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: { sub: number; email: string; role: Role }): JwtUser {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
