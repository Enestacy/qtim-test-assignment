import { Test, TestingModule } from '@nestjs/testing';
import { Logger, InternalServerErrorException } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { UserEntity } from './user.entity';
import { CreateUserDto } from './dtos';
import { randomUUID } from 'crypto';

describe('UserService', () => {
  let service: UserService;
  let userRepository: jest.Mocked<UserRepository>;
  let logger: Logger;

  const mockUser: UserEntity = {
    id: randomUUID(),
    firstName: 'John',
    lastName: 'Doe',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockCreateUserDto: CreateUserDto = {
    firstName: 'Jane',
    lastName: 'Smith',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: {
            findBy: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: Logger,
          useValue: {
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get(UserRepository);
    logger = module.get<Logger>(Logger);

    module.useLogger(logger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const mockUserId = mockUser.id;
      const userRepositoryFindBySpy = jest.spyOn(userRepository, 'findBy').mockResolvedValue(mockUser);

      const result = await service.getUserById(mockUserId);

      expect(userRepositoryFindBySpy).toHaveBeenCalledWith({ id: mockUserId }, { queryRunner: undefined });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      const userRepositoryFindBySpy = jest.spyOn(userRepository, 'findBy').mockResolvedValue(null);

      const result = await service.getUserById('non-existent');

      expect(userRepositoryFindBySpy).toHaveBeenCalledWith({ id: 'non-existent' }, { queryRunner: undefined });
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create user', async () => {
      const userRepositoryCreateSpy = jest.spyOn(userRepository, 'create').mockResolvedValue(mockUser);

      const result = await service.create(mockCreateUserDto);

      expect(userRepositoryCreateSpy).toHaveBeenCalledWith(mockCreateUserDto, { queryRunner: undefined });
      expect(result).toEqual(mockUser);
    });

    it('should throw InternalServerErrorException if creation fails', async () => {
      const userRepositoryCreateSpy = jest.spyOn(userRepository, 'create').mockResolvedValue(null);

      await expect(service.create(mockCreateUserDto)).rejects.toThrow(InternalServerErrorException);
      expect(userRepositoryCreateSpy).toHaveBeenCalledWith(mockCreateUserDto, { queryRunner: undefined });
    });

    it('should handle error during creation', async () => {
      const error = new Error('Database error');
      const userRepositoryCreateSpy = jest.spyOn(userRepository, 'create').mockRejectedValue(error);

      await expect(service.create(mockCreateUserDto)).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalledWith('Database error', undefined, 'UserService');
      expect(userRepositoryCreateSpy).toHaveBeenCalledWith(mockCreateUserDto, { queryRunner: undefined });
    });
  });
});
