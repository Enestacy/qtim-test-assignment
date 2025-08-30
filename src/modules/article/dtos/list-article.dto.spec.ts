import 'reflect-metadata';

import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ListArticleDto } from './list-article.dto';
import { DEFAULT_BATCH_SIZE, MAX_BATCH_SIZE } from 'src/common/constants';

describe('ListArticleDto', () => {
  describe('validation', () => {
    it('should pass validation with no parameters', async () => {
      const dto = new ListArticleDto();

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass validation with pagination only', async () => {
      const dto = new ListArticleDto();
      dto.limit = 10;
      dto.offset = 20;

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass validation with where filter', async () => {
      const dto = plainToClass(ListArticleDto, {
        where: {
          title: {
            contains: 'test',
          },
        },
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass validation with orderBy', async () => {
      const dto = plainToClass(ListArticleDto, {
        orderBy: {
          title: 'asc',
        },
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass validation with all parameters', async () => {
      const dto = plainToClass(ListArticleDto, {
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
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should handle empty where object', async () => {
      const dto = plainToClass(ListArticleDto, {
        where: {},
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should handle empty orderBy object', async () => {
      const dto = plainToClass(ListArticleDto, {
        orderBy: {},
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should handle null values', async () => {
      const dto = new ListArticleDto();
      (dto as any).where = null;
      (dto as any).orderBy = null;

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });

  describe('pagination', () => {
    it('should use default values when not provided', async () => {
      const dto = new ListArticleDto();

      expect(dto.limit).toBe(DEFAULT_BATCH_SIZE);
      expect(dto.offset).toBe(0);
    });

    it('should accept valid limit values', async () => {
      const dto = new ListArticleDto();
      dto.limit = 50;

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should accept valid offset values', async () => {
      const dto = new ListArticleDto();
      dto.offset = 100;

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should handle invalid limit values', async () => {
      const dto = new ListArticleDto();
      dto.limit = -1;

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
    });

    it('should handle invalid offset values', async () => {
      const dto = new ListArticleDto();
      dto.offset = -1;

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
    });

    it('should return error if limit is greater than MAX_BATCH_SIZE', async () => {
      const dto = new ListArticleDto();
      dto.limit = MAX_BATCH_SIZE + 1;

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
    });
  });

  describe('where filter', () => {
    it('should accept equals filter', async () => {
      const dto = plainToClass(ListArticleDto, {
        where: {
          title: {
            equals: 'Test Article',
          },
        },
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should accept contains filter', async () => {
      const dto = plainToClass(ListArticleDto, {
        where: {
          title: {
            contains: 'test',
          },
        },
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should accept startsWith filter', async () => {
      const dto = plainToClass(ListArticleDto, {
        where: {
          title: {
            startsWith: 'Test',
          },
        },
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should accept endsWith filter', async () => {
      const dto = plainToClass(ListArticleDto, {
        where: {
          title: {
            endsWith: 'Article',
          },
        },
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should accept in filter', async () => {
      const dto = plainToClass(ListArticleDto, {
        where: {
          title: {
            in: ['Article 1', 'Article 2'],
          },
        },
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should accept date filters', async () => {
      const dto = plainToClass(ListArticleDto, {
        where: {
          publishedAt: {
            gteDate: '2024-01-01T00:00:00Z',
          },
        },
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should accept multiple filters', async () => {
      const dto = plainToClass(ListArticleDto, {
        where: {
          title: {
            contains: 'test',
          },
          publishedAt: {
            gteDate: '2024-01-01T00:00:00Z',
          },
        },
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should return error if where is not a valid object', async () => {
      const dto = new ListArticleDto();
      dto.where = 123 as any;

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
    });

    it('should return error if where contains invalid filter', async () => {
      const dto = new ListArticleDto();
      dto.where = {
        title: {
          ['invalid' as any]: 'test',
        },
      };

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
    });
  });

  describe('orderBy', () => {
    it('should accept asc order', async () => {
      const dto = plainToClass(ListArticleDto, {
        orderBy: {
          title: 'asc',
        },
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should accept desc order', async () => {
      const dto = plainToClass(ListArticleDto, {
        orderBy: {
          publishedAt: 'desc',
        },
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should accept multiple order fields', async () => {
      const dto = plainToClass(ListArticleDto, {
        orderBy: {
          publishedAt: 'desc',
          title: 'asc',
        },
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should return error if orderBy is not a valid object', async () => {
      const dto = plainToClass(ListArticleDto, {
        orderBy: 123 as any,
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('orderBy');
      expect(errors[0].constraints).toHaveProperty('isObject');
    });

    it('should return error if orderBy contains invalid field', async () => {
      const dto = plainToClass(ListArticleDto, {
        orderBy: {
          title: 'invalid' as any,
        },
      });

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
    });
  });
});
