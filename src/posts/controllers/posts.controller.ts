import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PostsService } from '../services/posts.service';
import { CreatePostDto, UpdatePostDto } from '../dtos/post.dto';
import { Public } from '../../auth/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import type { JwtUser } from '../../auth/strategies/jwt.strategy';
import { Role } from '../../usuarios/entities/usuario.entity';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @Roles(Role.PROPIETARIO, Role.ADMIN)
  create(@Body() dto: CreatePostDto, @GetUser() user: JwtUser) {
    return this.postsService.create(dto, user);
  }

  @Public()
  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  /** Feed paginado: GET /posts/feed?limit=10&cursor=<id del último post> */
  @Public()
  @Get('feed')
  feed(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('cursor', new ParseIntPipe({ optional: true })) cursor?: number,
  ) {
    return this.postsService.feed(limit, cursor);
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
  @Roles(Role.PROPIETARIO, Role.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostDto,
    @GetUser() user: JwtUser,
  ) {
    return this.postsService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(Role.PROPIETARIO, Role.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: JwtUser) {
    return this.postsService.remove(id, user);
  }
}
