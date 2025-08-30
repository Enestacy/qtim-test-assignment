import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

describe('CreateUserDto', () => {
  describe('validation', () => {
    it('should pass validation with correct data', async () => {
      const dto = new CreateUserDto();
      dto.firstName = 'John';
      dto.lastName = 'Doe';

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
    it('should return errors for all fields if they are not defined', async () => {
      const dto = new CreateUserDto();

      const errors = await validate(dto);

      expect(errors).toHaveLength(2);
      expect(errors.some(e => e.property === 'firstName')).toBe(true);
      expect(errors.some(e => e.property === 'lastName')).toBe(true);
    });
    it('should return error with empty strings for fields', async () => {
      const dto = new CreateUserDto();
      dto.firstName = '';
      dto.lastName = '';

      const errors = await validate(dto);

      expect(errors).toHaveLength(2);
      expect(errors.some(e => e.property === 'firstName')).toBe(true);
      expect(errors.some(e => e.property === 'lastName')).toBe(true);
    });
  });

  describe('firstName', () => {
    it('should return error if firstName is not defined', async () => {
      const dto = new CreateUserDto();
      dto.lastName = 'Doe';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('firstName');
      expect(errors[0].constraints).toHaveProperty('isDefined');
    });

    it('should return error if firstName is not a string', async () => {
      const dto = new CreateUserDto();
      dto.firstName = 123 as any;
      dto.lastName = 'Doe';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('firstName');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should return error if firstName is longer than 250 characters', async () => {
      const dto = new CreateUserDto();
      dto.firstName = 'a'.repeat(251);
      dto.lastName = 'Doe';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('firstName');
      expect(errors[0].constraints).toHaveProperty('maxLength');
    });

    it('should pass validation with firstName exactly 250 characters long', async () => {
      const dto = new CreateUserDto();
      dto.firstName = 'a'.repeat(250);
      dto.lastName = 'Doe';

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });

  describe('lastName', () => {
    it('should return error if lastName is not defined', async () => {
      const dto = new CreateUserDto();
      dto.firstName = 'John';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('lastName');
      expect(errors[0].constraints).toHaveProperty('isDefined');
    });

    it('should return error if lastName is not a string', async () => {
      const dto = new CreateUserDto();
      dto.firstName = 'John';
      dto.lastName = 123 as any;

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('lastName');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should return error if lastName is longer than 250 characters', async () => {
      const dto = new CreateUserDto();
      dto.firstName = 'John';
      dto.lastName = 'a'.repeat(251);

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('lastName');
      expect(errors[0].constraints).toHaveProperty('maxLength');
    });

    it('should pass validation with lastName exactly 250 characters long', async () => {
      const dto = new CreateUserDto();
      dto.firstName = 'John';
      dto.lastName = 'a'.repeat(250);

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });
});
