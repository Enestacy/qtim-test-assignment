import { Test, TestingModule } from '@nestjs/testing';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { CreateArticleDto, UpdateArticleDto } from './dtos';
import { ListArticleDto } from './dtos/list-article.dto';
import { JwtPayload } from '../../common/types/jwt-payload.types';

describe('ArticleController', () => {
  let controller: ArticleController;
  let articleService: jest.Mocked<ArticleService>;

  const mockArticle = {
    id: 'article-1',
    title: 'Test Article',
    description: 'Test Description',
    publishedAt: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    author: {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
    },
  };

  const mockUser: JwtPayload = {
    sub: 'user-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArticleController],
      providers: [
        {
          provide: ArticleService,
          useValue: {
            list: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ArticleController>(ArticleController);
    articleService = module.get(ArticleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    const mockListQuery: ListArticleDto = {
      offset: 0,
      limit: 10,
      where: {
        title: {
          contains: 'test',
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
    };

    it('should successfully list articles', async () => {
      const mockResponse = {
        data: [mockArticle],
        total: 1,
      };
      const articleServiceListSpy = jest.spyOn(articleService, 'list').mockResolvedValue(mockResponse);

      const result = await controller.list(mockListQuery);

      expect(articleServiceListSpy).toHaveBeenCalledWith(mockListQuery);
      expect(result).toEqual(mockResponse);
    });

    it('should pass error from service', async () => {
      const error = new Error('Failed to list articles');
      const articleServiceListSpy = jest.spyOn(articleService, 'list').mockRejectedValue(error);

      await expect(controller.list(mockListQuery)).rejects.toThrow(error);
      expect(articleServiceListSpy).toHaveBeenCalledWith(mockListQuery);
    });
  });

  describe('findOne', () => {
    const articleId = 'article-1';

    it('should successfully find article by id', async () => {
      const articleServiceFindByIdSpy = jest.spyOn(articleService, 'findById').mockResolvedValue(mockArticle);

      const result = await controller.findOne(articleId);

      expect(articleServiceFindByIdSpy).toHaveBeenCalledWith(articleId);
      expect(result).toEqual(mockArticle);
    });

    it('should pass error from service', async () => {
      const error = new Error('Article not found');
      const articleServiceFindByIdSpy = jest.spyOn(articleService, 'findById').mockRejectedValue(error);

      await expect(controller.findOne(articleId)).rejects.toThrow(error);
      expect(articleServiceFindByIdSpy).toHaveBeenCalledWith(articleId);
    });
  });

  describe('create', () => {
    const mockCreateArticleDto: CreateArticleDto = {
      title: 'New Article',
      description: 'New Description',
      publishedAt: new Date('2024-01-01'),
    };

    it('should successfully create article', async () => {
      const articleServiceCreateSpy = jest.spyOn(articleService, 'create').mockResolvedValue(mockArticle);

      const result = await controller.create(mockCreateArticleDto, mockUser);

      expect(articleServiceCreateSpy).toHaveBeenCalledWith(mockCreateArticleDto, mockUser.sub);
      expect(result).toEqual(mockArticle);
    });

    it('should pass error from service', async () => {
      const error = new Error('Failed to create article');
      const articleServiceCreateSpy = jest.spyOn(articleService, 'create').mockRejectedValue(error);

      await expect(controller.create(mockCreateArticleDto, mockUser)).rejects.toThrow(error);
      expect(articleServiceCreateSpy).toHaveBeenCalledWith(mockCreateArticleDto, mockUser.sub);
    });
  });

  describe('update', () => {
    const articleId = 'article-1';
    const mockUpdateArticleDto: UpdateArticleDto = {
      title: 'Updated Article',
      description: 'Updated Description',
    };

    it('should successfully update article', async () => {
      const articleServiceUpdateSpy = jest.spyOn(articleService, 'update').mockResolvedValue(mockArticle);

      const result = await controller.update(articleId, mockUpdateArticleDto, mockUser);

      expect(articleServiceUpdateSpy).toHaveBeenCalledWith(articleId, mockUpdateArticleDto, mockUser.sub);
      expect(result).toEqual(mockArticle);
    });

    it('should pass error from service', async () => {
      const error = new Error('Failed to update article');
      const articleServiceUpdateSpy = jest.spyOn(articleService, 'update').mockRejectedValue(error);

      await expect(controller.update(articleId, mockUpdateArticleDto, mockUser)).rejects.toThrow(error);
      expect(articleServiceUpdateSpy).toHaveBeenCalledWith(articleId, mockUpdateArticleDto, mockUser.sub);
    });
  });

  describe('delete', () => {
    const articleId = 'article-1';

    it('should successfully delete article', async () => {
      const articleServiceDeleteSpy = jest.spyOn(articleService, 'delete').mockResolvedValue(undefined);

      const result = await controller.delete(articleId, mockUser);

      expect(articleServiceDeleteSpy).toHaveBeenCalledWith(articleId, mockUser.sub);
      expect(result).toBeUndefined();
    });

    it('should pass error from service', async () => {
      const error = new Error('Failed to delete article');
      const articleServiceDeleteSpy = jest.spyOn(articleService, 'delete').mockRejectedValue(error);

      await expect(controller.delete(articleId, mockUser)).rejects.toThrow(error);
      expect(articleServiceDeleteSpy).toHaveBeenCalledWith(articleId, mockUser.sub);
    });
  });
});
