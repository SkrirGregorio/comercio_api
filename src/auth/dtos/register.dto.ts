import {
  Equals,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../../usuarios/entities/usuario.entity';

/** Roles que un visitante puede elegir al registrarse. `admin` solo lo asigna otro admin. */
export const SELF_REGISTER_ROLES = [Role.CONSUMIDOR, Role.PROPIETARIO] as const;

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @IsEmail()
  @MaxLength(100)
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(72) // límite de bcrypt
  password: string;

  @IsOptional()
  @IsIn(SELF_REGISTER_ROLES, {
    message: 'El rol debe ser consumidor o propietario',
  })
  role?: Role.CONSUMIDOR | Role.PROPIETARIO;

  /** Aceptación de Términos y Política de Privacidad y declaración de mayoría de edad. */
  @Equals(true, {
    message: 'Debes aceptar los términos y la política de privacidad',
  })
  aceptaTerminos: boolean;
}
