import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { PostsService } from '../services/posts.service';
import { CreatePostDto, UpdatePostDto } from '../dtos/post.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../auth/decorators/public.decorator';
import { Request as ExpressRequest } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(
    @Body() createPostDto: CreatePostDto,
    @Request() req: ExpressRequest & { user: { userId: number } },
  ) {
    const propietarioId = req.user.userId;
    return this.postsService.create(createPostDto, propietarioId);
  }

  @Public()
  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @Public()
  @Get('empresa/:empresaId')
  findByEmpresa(@Param('empresaId', ParseIntPipe) empresaId: number) {
    return this.postsService.findByEmpresa(empresaId);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
    @Request() req: ExpressRequest & { user: { userId: number } },
  ) {
    const userId = req.user.userId;
    return this.postsService.update(id, updatePostDto, userId);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: ExpressRequest & { user: { userId: number } },
  ) {
    const userId = req.user.userId;
    return this.postsService.remove(id, userId);
  }
}
