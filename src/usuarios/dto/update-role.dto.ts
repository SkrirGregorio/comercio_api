import { IsEnum } from 'class-validator';
import { Role } from '../entities/usuario.entity';

export class UpdateRoleDto {
  @IsEnum(Role, {
    message: 'El rol debe ser: admin, propietario o consumidor',
  })
  role: Role;
}
