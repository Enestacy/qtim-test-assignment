import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleDto, UpdateArticleDto } from './dtos';
import { ListArticleDto } from './dtos/list-article.dto';
import { AccessTokenGuard } from '../../common/guards/access-token.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/types/jwt-payload.types';
import {
  CreateArticleResponse,
  DeleteArticleResponse,
  GetArticleByIdResponse,
  ListArticleResponse,
  UpdateArticleResponse,
} from './article.contracts';

@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  async list(@Query() query: ListArticleDto): Promise<ListArticleResponse> {
    return this.articleService.list(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<GetArticleByIdResponse> {
    return this.articleService.findById(id);
  }

  @UseGuards(AccessTokenGuard)
  @Post()
  async create(
    @Body() createArticleDto: CreateArticleDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<CreateArticleResponse> {
    return this.articleService.create(createArticleDto, user.sub);
  }

  @UseGuards(AccessTokenGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<UpdateArticleResponse> {
    return this.articleService.update(id, updateArticleDto, user.sub);
  }

  @UseGuards(AccessTokenGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload): Promise<DeleteArticleResponse> {
    return this.articleService.delete(id, user.sub);
  }
}
