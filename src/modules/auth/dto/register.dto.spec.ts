import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

describe('RegisterDto', () => {
  describe('validation', () => {
    it('should pass validation with correct data', async () => {
      const dto = new RegisterDto();
      dto.login = 'testuser';
      dto.password = 'Password123!';
      dto.firstName = 'John';
      dto.lastName = 'Doe';

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should return errors for all fields if they are not defined', async () => {
      const dto = new RegisterDto();

      const errors = await validate(dto);

      expect(errors).toHaveLength(4);
      expect(errors.some(e => e.property === 'login')).toBe(true);
      expect(errors.some(e => e.property === 'password')).toBe(true);
      expect(errors.some(e => e.property === 'firstName')).toBe(true);
      expect(errors.some(e => e.property === 'lastName')).toBe(true);
    });
  });

  describe('login', () => {
    it('should return error if login is not defined', async () => {
      const dto = new RegisterDto();
      dto.password = 'Password123!';
      dto.firstName = 'John';
      dto.lastName = 'Doe';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('login');
      expect(errors[0].constraints).toHaveProperty('isDefined');
    });

    it('should return error if login is not a string', async () => {
      const dto = new RegisterDto();
      (dto as any).login = 123;
      dto.password = 'Password123!';
      dto.firstName = 'John';
      dto.lastName = 'Doe';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('login');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should return error if login is empty', async () => {
      const dto = new RegisterDto();
      dto.login = '';
      dto.password = 'Password123!';
      dto.firstName = 'John';
      dto.lastName = 'Doe';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('login');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });
  });

  describe('password', () => {
    it('should return error if password is not defined', async () => {
      const dto = new RegisterDto();
      dto.login = 'testuser';
      dto.firstName = 'John';
      dto.lastName = 'Doe';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('isDefined');
    });

    it('should return error if password is not a string', async () => {
      const dto = new RegisterDto();
      dto.login = 'testuser';
      (dto as any).password = 123;
      dto.firstName = 'John';
      dto.lastName = 'Doe';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should return error if password is less than 8 characters', async () => {
      const dto = new RegisterDto();
      dto.login = 'testuser';
      dto.password = 'Pass1!';
      dto.firstName = 'John';
      dto.lastName = 'Doe';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('minLength');
    });

    it('should return error if password does not contain an uppercase letter', async () => {
      const dto = new RegisterDto();
      dto.login = 'testuser';
      dto.password = 'password123!';
      dto.firstName = 'John';
      dto.lastName = 'Doe';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    it('should return error if password does not contain a lowercase letter', async () => {
      const dto = new RegisterDto();
      dto.login = 'testuser';
      dto.password = 'PASSWORD123!';
      dto.firstName = 'John';
      dto.lastName = 'Doe';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    it('should return error if password does not contain a number', async () => {
      const dto = new RegisterDto();
      dto.login = 'testuser';
      dto.password = 'Password!';
      dto.firstName = 'John';
      dto.lastName = 'Doe';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    it('should return error if password does not contain a special character', async () => {
      const dto = new RegisterDto();
      dto.login = 'testuser';
      dto.password = 'Password123';
      dto.firstName = 'John';
      dto.lastName = 'Doe';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    it('should pass validation with correct data', async () => {
      const dto = new RegisterDto();
      dto.login = 'testuser';
      dto.password = 'Password123!';
      dto.firstName = 'John';
      dto.lastName = 'Doe';

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
  });
});
