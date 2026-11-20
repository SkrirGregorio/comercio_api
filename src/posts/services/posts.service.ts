import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { CreatePostDto, UpdatePostDto } from '../dtos/post.dto';
import { Empresa } from '../../empresas/entities/empresa.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(Empresa)
    private readonly empresaRepo: Repository<Empresa>,
  ) {}

  async create(createPostDto: CreatePostDto, userId: number): Promise<Post> {
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
    userId: number,
  ): Promise<Post> {
    const post = await this.findOne(id);

    if (post.empresa.propietario.id !== userId) {
      throw new UnauthorizedException(
        'No tienes permiso para modificar este post.',
      );
    }

    const { empresaId, ...updateData } = updatePostDto;

    this.postRepo.merge(post, updateData);
    return this.postRepo.save(post);
  }

  async remove(id: number, userId: number): Promise<void> {
    const post = await this.findOne(id);
    if (post.empresa.propietario.id !== userId) {
      throw new UnauthorizedException(
        'No tienes permiso para eliminar este post.',
      );
    }

    const result = await this.postRepo.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Post con ID #${id} no encontrado.`);
    }
  }
}
