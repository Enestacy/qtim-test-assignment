import { validate } from 'class-validator';
import { CreateArticleDto } from './create-article.dto';

describe('CreateArticleDto', () => {
  describe('validation', () => {
    it('should pass validation with correct data', async () => {
      const dto = new CreateArticleDto();
      dto.title = 'Test Article';
      dto.description = 'Test Description';
      dto.publishedAt = '2024-01-01';

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass validation without optional description', async () => {
      const dto = new CreateArticleDto();
      dto.title = 'Test Article';
      dto.publishedAt = '2024-01-01';

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should return errors for empty object', async () => {
      const dto = new CreateArticleDto();

      const errors = await validate(dto);

      expect(errors).toHaveLength(2);
      expect(errors.some(e => e.property === 'title')).toBe(true);
      expect(errors.some(e => e.property === 'publishedAt')).toBe(true);
    });
  });

  describe('title', () => {
    it('should return error if title is not defined', async () => {
      const dto = new CreateArticleDto();
      dto.publishedAt = '2024-01-01';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('title');
      expect(errors[0].constraints).toHaveProperty('isDefined');
    });

    it('should return error if title is not a string', async () => {
      const dto = new CreateArticleDto();
      dto.title = 123 as any;
      dto.publishedAt = '2024-01-01';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('title');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should return error if title is empty', async () => {
      const dto = new CreateArticleDto();
      dto.title = '';
      dto.publishedAt = '2024-01-01';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('title');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should pass validation with valid title', async () => {
      const dto = new CreateArticleDto();
      dto.title = 'Valid Article Title';
      dto.publishedAt = '2024-01-01';

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });

  describe('description', () => {
    it('should pass validation when description is not provided', async () => {
      const dto = new CreateArticleDto();
      dto.title = 'Test Article';
      dto.publishedAt = '2024-01-01';

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should return error if description is not a string', async () => {
      const dto = new CreateArticleDto();
      dto.title = 'Test Article';
      dto.description = 123 as any;
      dto.publishedAt = '2024-01-01';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('description');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should return error if description is empty', async () => {
      const dto = new CreateArticleDto();
      dto.title = 'Test Article';
      dto.description = '';
      dto.publishedAt = '2024-01-01';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('description');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should pass validation with valid description', async () => {
      const dto = new CreateArticleDto();
      dto.title = 'Test Article';
      dto.description = 'Valid description';
      dto.publishedAt = '2024-01-01';

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });

  describe('publishedAt', () => {
    it('should return error if publishedAt is not defined', async () => {
      const dto = new CreateArticleDto();
      dto.title = 'Test Article';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('publishedAt');
      expect(errors[0].constraints).toHaveProperty('isDefined');
    });

    it('should return error if publishedAt is not a date', async () => {
      const dto = new CreateArticleDto();
      dto.title = 'Test Article';
      dto.publishedAt = 'invalid-date' as any;

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('publishedAt');
      expect(errors[0].constraints).toHaveProperty('isDate');
    });

    it('should return error if publishedAt is empty', async () => {
      const dto = new CreateArticleDto();
      dto.title = 'Test Article';
      dto.publishedAt = '' as any;

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('publishedAt');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should pass validation with valid date', async () => {
      const dto = new CreateArticleDto();
      dto.title = 'Test Article';
      dto.publishedAt = '2024-01-01';

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });
});
