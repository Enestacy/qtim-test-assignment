import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

describe('LoginDto', () => {
  describe('validation', () => {
    it('should pass validation with correct data', async () => {
      const dto = new LoginDto();
      dto.login = 'testuser';
      dto.password = 'password123';

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });
    it('should return errors for all fields if they are not defined', async () => {
      const dto = new LoginDto();

      const errors = await validate(dto);

      expect(errors).toHaveLength(2);
      expect(errors.some(e => e.property === 'login')).toBe(true);
      expect(errors.some(e => e.property === 'password')).toBe(true);
    });
    it('should return errors for all fields if they are empty', async () => {
      const dto = new LoginDto();
      dto.login = '';
      dto.password = '';

      const errors = await validate(dto);

      expect(errors).toHaveLength(2);
      expect(errors.some(e => e.property === 'login')).toBe(true);
      expect(errors.some(e => e.property === 'password')).toBe(true);
    });
  });

  describe('login', () => {
    it('should return error if login is not defined', async () => {
      const dto = new LoginDto();
      dto.password = 'password123';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('login');
      expect(errors[0].constraints).toHaveProperty('isDefined');
    });

    it('should return error if login is not a string', async () => {
      const dto = new LoginDto();
      dto.login = 123 as any;
      dto.password = 'password123';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('login');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should return error if login is empty', async () => {
      const dto = new LoginDto();
      dto.login = '';
      dto.password = 'password123';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('login');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });
  });

  describe('password', () => {
    it('should return error if password is not defined', async () => {
      const dto = new LoginDto();
      dto.login = 'testuser';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('isDefined');
    });

    it('should return error if password is not a string', async () => {
      const dto = new LoginDto();
      dto.login = 'testuser';
      dto.password = 123 as any;

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should return error if password is empty', async () => {
      const dto = new LoginDto();
      dto.login = 'testuser';
      dto.password = '';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });
  });
});
