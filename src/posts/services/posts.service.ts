import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { CreatePostDto, UpdatePostDto } from '../dtos/post.dto';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { Role } from '../../usuarios/entities/usuario.entity';
import type { JwtUser } from '../../auth/strategies/jwt.strategy';

export const FEED_MAX_LIMIT = 30;

export interface PostsFeed {
  items: Post[];
  /** id para pedir la siguiente página; null cuando no hay más */
  nextCursor: number | null;
}

function puedeGestionar(empresa: Empresa, user: JwtUser): boolean {
  return user.role === Role.ADMIN || empresa.propietario?.id === user.userId;
}

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(Empresa)
    private readonly empresaRepo: Repository<Empresa>,
  ) {}

  async create(createPostDto: CreatePostDto, user: JwtUser): Promise<Post> {
    const { empresaId, ...postData } = createPostDto;

    const empresa = await this.empresaRepo.findOne({
      where: { id: empresaId },
      relations: ['propietario'],
    });

    if (!empresa) {
      throw new NotFoundException(
        `Empresa con ID #${empresaId} no encontrada.`,
      );
    }

    if (!puedeGestionar(empresa, user)) {
      throw new ForbiddenException(
        'Solo el propietario de la empresa puede publicar en ella.',
      );
    }

    const nuevoPost = this.postRepo.create({
      ...postData,
      empresa,
    });

    return this.postRepo.save(nuevoPost);
  }

  findAll(): Promise<Post[]> {
    return this.postRepo.find({
      relations: ['empresa'],
    });
  }

  /**
   * Feed público paginado por cursor (más recientes primero). El cursor es el id del
   * último post recibido: a diferencia de OFFSET, no repite ni salta posts si se
   * publican nuevos mientras el usuario hace scroll.
   */
  async feed(limit: number, cursor?: number): Promise<PostsFeed> {
    const take = Math.min(Math.max(limit, 1), FEED_MAX_LIMIT);
    const qb = this.postRepo
      .createQueryBuilder('post')
      .innerJoin('post.empresa', 'empresa')
      .select([
        'post.id',
        'post.titulo',
        'post.contenido',
        'post.urlImagen',
        'post.createdAt',
        'empresa.id',
        'empresa.nombre',
        'empresa.urlAvatar',
      ])
      .orderBy('post.id', 'DESC')
      .take(take + 1); // uno extra para saber si hay más
    if (cursor) {
      qb.where('post.id < :cursor', { cursor });
    }
    const posts = await qb.getMany();
    const hayMas = posts.length > take;
    const items = hayMas ? posts.slice(0, take) : posts;
    return {
      items,
      nextCursor: hayMas ? items[items.length - 1].id : null,
    };
  }

  findByEmpresa(empresaId: number): Promise<Post[]> {
    return this.postRepo.find({
      where: { empresa: { id: empresaId } },
      relations: ['empresa', 'empresa.propietario'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Post> {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: ['empresa', 'empresa.propietario'],
    });
    if (!post) {
      throw new NotFoundException(`Post con ID #${id} no encontrado.`);
    }
    return post;
  }

  async update(
    id: number,
    updatePostDto: UpdatePostDto,
    user: JwtUser,
  ): Promise<Post> {
    const post = await this.findOne(id);

    if (!puedeGestionar(post.empresa, user)) {
      throw new ForbiddenException(
        'No tienes permiso para modificar este post.',
      );
    }

    const { empresaId, ...updateData } = updatePostDto;

    this.postRepo.merge(post, updateData);
    return this.postRepo.save(post);
  }

  async remove(id: number, user: JwtUser): Promise<void> {
    const post = await this.findOne(id);
    if (!puedeGestionar(post.empresa, user)) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar este post.',
      );
    }

    const result = await this.postRepo.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Post con ID #${id} no encontrado.`);
    }
  }
}
