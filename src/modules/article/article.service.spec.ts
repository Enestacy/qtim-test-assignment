import { Test, TestingModule } from '@nestjs/testing';
import { Logger, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleRepository } from './article.repository';
import { CreateArticleDto, UpdateArticleDto, ListArticleDto } from './dtos';
import { ArticleWithAuthor } from './types/article.types';
import { ArticleEntity } from './article.entity';
import { randomUUID } from 'crypto';

describe('ArticleService', () => {
  let service: ArticleService;
  let articleRepository: jest.Mocked<ArticleRepository>;

  const mockArticle: ArticleEntity = {
    id: randomUUID(),
    authorId: 'user-1',
    title: 'Test Article',
    description: 'Test Description',
    publishedAt: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    author: {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  };

  const mockArticleWithAuthor: ArticleWithAuthor = {
    id: mockArticle.id,
    title: mockArticle.title,
    description: mockArticle.description,
    publishedAt: mockArticle.publishedAt,
    createdAt: mockArticle.createdAt,
    author: {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        {
          provide: ArticleRepository,
          useValue: {
            create: jest.fn(),
            findByWithAuthor: jest.fn(),
            update: jest.fn(),
            findBy: jest.fn(),
            delete: jest.fn(),
            findAndCountAll: jest.fn(),
          },
        },
        Logger,
      ],
    }).compile();

    service = module.get<ArticleService>(ArticleService);
    articleRepository = module.get(ArticleRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createArticleDto: CreateArticleDto = {
      title: 'New Article',
      description: 'New Description',
      publishedAt: new Date('2024-01-01'),
    };
    const authorId = 'user-1';

    it('should successfully create article', async () => {
      const articleRepositoryCreateSpy = jest.spyOn(articleRepository, 'create').mockResolvedValue(mockArticle);
      const articleRepositoryFindByWithAuthorSpy = jest
        .spyOn(articleRepository, 'findByWithAuthor')
        .mockResolvedValue(mockArticleWithAuthor);

      const result = await service.create(createArticleDto, authorId);

      expect(articleRepositoryCreateSpy).toHaveBeenCalledWith({
        ...createArticleDto,
        authorId,
      });
      expect(articleRepositoryFindByWithAuthorSpy).toHaveBeenCalledWith({ id: mockArticle.id });
      expect(result).toEqual(mockArticleWithAuthor);
    });

    it('should throw InternalServerErrorException if article creation fails', async () => {
      const articleRepositoryCreateSpy = jest.spyOn(articleRepository, 'create').mockResolvedValue(null);

      await expect(service.create(createArticleDto, authorId)).rejects.toThrow(InternalServerErrorException);
      expect(articleRepositoryCreateSpy).toHaveBeenCalledWith({
        ...createArticleDto,
        authorId,
      });
    });

    it('should throw InternalServerErrorException if repository throws error', async () => {
      const error = new Error('Database error');
      const articleRepositoryCreateSpy = jest.spyOn(articleRepository, 'create').mockRejectedValue(error);

      await expect(service.create(createArticleDto, authorId)).rejects.toThrow(InternalServerErrorException);
      expect(articleRepositoryCreateSpy).toHaveBeenCalledWith({
        ...createArticleDto,
        authorId,
      });
    });
  });

  describe('update', () => {
    const articleId = 'article-1';
    const updateArticleDto: UpdateArticleDto = {
      title: 'Updated Article',
      description: 'Updated Description',
    };
    const authorId = 'user-1';

    it('should successfully update article', async () => {
      const articleRepositoryUpdateSpy = jest
        .spyOn(articleRepository, 'update')
        .mockResolvedValue({ affected: 1 } as any);
      const articleRepositoryFindByWithAuthorSpy = jest
        .spyOn(articleRepository, 'findByWithAuthor')
        .mockResolvedValue(mockArticleWithAuthor);

      const result = await service.update(articleId, updateArticleDto, authorId);

      expect(articleRepositoryUpdateSpy).toHaveBeenCalledWith({ id: articleId, authorId }, updateArticleDto);
      expect(articleRepositoryFindByWithAuthorSpy).toHaveBeenCalledWith({ id: articleId });
      expect(result).toEqual(mockArticleWithAuthor);
    });

    it('should throw InternalServerErrorException if update fails', async () => {
      const articleRepositoryUpdateSpy = jest.spyOn(articleRepository, 'update').mockResolvedValue(null);

      await expect(service.update(articleId, updateArticleDto, authorId)).rejects.toThrow(InternalServerErrorException);
      expect(articleRepositoryUpdateSpy).toHaveBeenCalledWith({ id: articleId, authorId }, updateArticleDto);
    });

    it('should throw NotFoundException if no rows affected', async () => {
      const articleRepositoryUpdateSpy = jest
        .spyOn(articleRepository, 'update')
        .mockResolvedValue({ affected: 0 } as any);

      await expect(service.update(articleId, updateArticleDto, authorId)).rejects.toThrow(NotFoundException);
      expect(articleRepositoryUpdateSpy).toHaveBeenCalledWith({ id: articleId, authorId }, updateArticleDto);
    });

    it('should throw NotFoundException if article not found after update', async () => {
      const articleRepositoryUpdateSpy = jest
        .spyOn(articleRepository, 'update')
        .mockResolvedValue({ affected: 1 } as any);
      const articleRepositoryFindByWithAuthorSpy = jest
        .spyOn(articleRepository, 'findByWithAuthor')
        .mockResolvedValue(null);

      await expect(service.update(articleId, updateArticleDto, authorId)).rejects.toThrow(NotFoundException);
      expect(articleRepositoryUpdateSpy).toHaveBeenCalledWith({ id: articleId, authorId }, updateArticleDto);
      expect(articleRepositoryFindByWithAuthorSpy).toHaveBeenCalledWith({ id: articleId });
    });

    it('should pass error from repository', async () => {
      const error = new Error('Database error');
      const articleRepositoryUpdateSpy = jest.spyOn(articleRepository, 'update').mockRejectedValue(error);

      await expect(service.update(articleId, updateArticleDto, authorId)).rejects.toThrow(error);
      expect(articleRepositoryUpdateSpy).toHaveBeenCalledWith({ id: articleId, authorId }, updateArticleDto);
    });
  });

  describe('delete', () => {
    const articleId = 'article-1';
    const authorId = 'user-1';

    it('should successfully delete article', async () => {
      const articleRepositoryFindBySpy = jest.spyOn(articleRepository, 'findBy').mockResolvedValue(mockArticle);
      const articleRepositoryDeleteSpy = jest
        .spyOn(articleRepository, 'delete')
        .mockResolvedValue({ affected: 1 } as any);

      const result = await service.delete(articleId, authorId);

      expect(articleRepositoryFindBySpy).toHaveBeenCalledWith({ where: { id: articleId } });
      expect(articleRepositoryDeleteSpy).toHaveBeenCalledWith({ id: articleId, authorId });
      expect(result).toBeUndefined();
    });

    it('should throw NotFoundException if article not found', async () => {
      const articleRepositoryFindBySpy = jest.spyOn(articleRepository, 'findBy').mockResolvedValue(null);

      await expect(service.delete(articleId, authorId)).rejects.toThrow(NotFoundException);
      expect(articleRepositoryFindBySpy).toHaveBeenCalledWith({ where: { id: articleId } });
    });

    it('should throw ForbiddenException if user is not the author', async () => {
      const differentAuthorId = 'user-2';
      const articleRepositoryFindBySpy = jest.spyOn(articleRepository, 'findBy').mockResolvedValue(mockArticle);

      await expect(service.delete(articleId, differentAuthorId)).rejects.toThrow(ForbiddenException);
      expect(articleRepositoryFindBySpy).toHaveBeenCalledWith({ where: { id: articleId } });
    });

    it('should throw InternalServerErrorException if delete fails', async () => {
      const articleRepositoryFindBySpy = jest.spyOn(articleRepository, 'findBy').mockResolvedValue(mockArticle);
      const articleRepositoryDeleteSpy = jest.spyOn(articleRepository, 'delete').mockResolvedValue(null);

      await expect(service.delete(articleId, authorId)).rejects.toThrow(InternalServerErrorException);
      expect(articleRepositoryFindBySpy).toHaveBeenCalledWith({ where: { id: articleId } });
      expect(articleRepositoryDeleteSpy).toHaveBeenCalledWith({ id: articleId, authorId });
    });

    it('should throw InternalServerErrorException if no rows affected', async () => {
      const articleRepositoryFindBySpy = jest.spyOn(articleRepository, 'findBy').mockResolvedValue(mockArticle);
      const articleRepositoryDeleteSpy = jest
        .spyOn(articleRepository, 'delete')
        .mockResolvedValue({ affected: 0 } as any);

      await expect(service.delete(articleId, authorId)).rejects.toThrow(InternalServerErrorException);
      expect(articleRepositoryFindBySpy).toHaveBeenCalledWith({ where: { id: articleId } });
      expect(articleRepositoryDeleteSpy).toHaveBeenCalledWith({ id: articleId, authorId });
    });

    it('should pass error from repository', async () => {
      const error = new Error('Database error');
      const articleRepositoryFindBySpy = jest.spyOn(articleRepository, 'findBy').mockRejectedValue(error);

      await expect(service.delete(articleId, authorId)).rejects.toThrow(error);
      expect(articleRepositoryFindBySpy).toHaveBeenCalledWith({ where: { id: articleId } });
    });
  });

  describe('findById', () => {
    const articleId = 'article-1';

    it('should successfully find article by id', async () => {
      const articleRepositoryFindByWithAuthorSpy = jest
        .spyOn(articleRepository, 'findByWithAuthor')
        .mockResolvedValue(mockArticleWithAuthor);

      const result = await service.findById(articleId);

      expect(articleRepositoryFindByWithAuthorSpy).toHaveBeenCalledWith({ id: articleId });
      expect(result).toEqual(mockArticleWithAuthor);
    });

    it('should throw NotFoundException if article not found', async () => {
      const articleRepositoryFindByWithAuthorSpy = jest
        .spyOn(articleRepository, 'findByWithAuthor')
        .mockResolvedValue(null);

      await expect(service.findById(articleId)).rejects.toThrow(NotFoundException);
      expect(articleRepositoryFindByWithAuthorSpy).toHaveBeenCalledWith({ id: articleId });
    });

    it('should pass error from repository', async () => {
      const error = new Error('Database error');
      const articleRepositoryFindByWithAuthorSpy = jest
        .spyOn(articleRepository, 'findByWithAuthor')
        .mockRejectedValue(error);

      await expect(service.findById(articleId)).rejects.toThrow(error);
      expect(articleRepositoryFindByWithAuthorSpy).toHaveBeenCalledWith({ id: articleId });
    });
  });

  describe('list', () => {
    const listArticleDto: ListArticleDto = {
      limit: 10,
      offset: 0,
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
        data: [mockArticleWithAuthor],
        total: 1,
      };
      const articleRepositoryFindAndCountAllSpy = jest
        .spyOn(articleRepository, 'findAndCountAll')
        // @ts-expect-error todo-typo
        .mockResolvedValue([[mockArticleWithAuthor], 1]);

      const result = await service.list(listArticleDto);

      expect(articleRepositoryFindAndCountAllSpy).toHaveBeenCalledWith({
        where: expect.any(Object),
        order: expect.any(Object),
        skip: 0,
        take: 10,
        relations: ['author'],
        select: {
          id: true,
          title: true,
          description: true,
          publishedAt: true,
          createdAt: true,
          author: { id: true, firstName: true, lastName: true },
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should use default values when not provided', async () => {
      const listArticleDtoWithoutDefaults: ListArticleDto = {};
      const mockResponse = {
        data: [],
        total: 0,
      };
      const articleRepositoryFindAndCountAllSpy = jest
        .spyOn(articleRepository, 'findAndCountAll')
        .mockResolvedValue([[], 0]);

      const result = await service.list(listArticleDtoWithoutDefaults);

      expect(articleRepositoryFindAndCountAllSpy).toHaveBeenCalledWith({
        where: expect.any(Object),
        order: expect.any(Object),
        skip: 0,
        take: 20,
        relations: ['author'],
        select: {
          id: true,
          title: true,
          description: true,
          publishedAt: true,
          createdAt: true,
          author: { id: true, firstName: true, lastName: true },
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should pass error from repository', async () => {
      const error = new Error('Database error');
      const articleRepositoryFindAndCountAllSpy = jest
        .spyOn(articleRepository, 'findAndCountAll')
        .mockRejectedValue(error);

      await expect(service.list(listArticleDto)).rejects.toThrow(error);
      expect(articleRepositoryFindAndCountAllSpy).toHaveBeenCalled();
    });
  });
});
