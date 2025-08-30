import { validate } from 'class-validator';
import { UpdateArticleDto } from './update-article.dto';

describe('UpdateArticleDto', () => {
  describe('validation', () => {
    it('should pass validation with correct data', async () => {
      const dto = new UpdateArticleDto();
      dto.title = 'Updated Article';
      dto.description = 'Updated Description';
      dto.publishedAt = new Date('2024-01-01');

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass validation with only title', async () => {
      const dto = new UpdateArticleDto();
      dto.title = 'Updated Article';

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass validation with only description', async () => {
      const dto = new UpdateArticleDto();
      dto.description = 'Updated Description';

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass validation with only publishedAt', async () => {
      const dto = new UpdateArticleDto();
      dto.publishedAt = new Date('2024-01-01');

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass validation with null description', async () => {
      const dto = new UpdateArticleDto();
      dto.title = 'Updated Article';
      dto.description = null;

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should return error if no fields are provided', async () => {
      const dto = new UpdateArticleDto();

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('hasAtLeastOneField');
    });
  });

  describe('title', () => {
    it('should return error if title is not a string', async () => {
      const dto = new UpdateArticleDto();
      (dto as any).title = 123;

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('title');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should return error if title is empty', async () => {
      const dto = new UpdateArticleDto();
      dto.title = '';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('title');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should pass validation with valid title', async () => {
      const dto = new UpdateArticleDto();
      dto.title = 'Valid Updated Title';

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });

  describe('description', () => {
    it('should return error if description is not a string', async () => {
      const dto = new UpdateArticleDto();
      (dto as any).description = 123;

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('description');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should pass validation with null description', async () => {
      const dto = new UpdateArticleDto();
      dto.description = null;

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass validation with valid description', async () => {
      const dto = new UpdateArticleDto();
      dto.description = 'Valid updated description';

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });

  describe('publishedAt', () => {
    it('should return error if publishedAt is not a date', async () => {
      const dto = new UpdateArticleDto();
      (dto as any).publishedAt = 'invalid-date';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('publishedAt');
      expect(errors[0].constraints).toHaveProperty('isDate');
    });

    it('should return error if publishedAt is empty', async () => {
      const dto = new UpdateArticleDto();
      (dto as any).publishedAt = '';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('publishedAt');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should pass validation with valid date', async () => {
      const dto = new UpdateArticleDto();
      dto.publishedAt = new Date('2024-01-01T10:00:00Z');

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });

  describe('custom validator - hasAtLeastOneField', () => {
    it('should return error when no fields are provided', async () => {
      const dto = new UpdateArticleDto();

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('hasAtLeastOneField');
      expect(errors[0].constraints.hasAtLeastOneField).toBe('At least one field must be provided');
    });

    it('should pass validation when at least one field is provided', async () => {
      const dto = new UpdateArticleDto();
      dto.title = 'Test';

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });
});
