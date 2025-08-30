import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';

import { UserEntity } from './user.entity';
import { Transactional } from 'src/common/types';
import { UserRepository } from './user.repository';
import { CreateUserDto } from './dtos';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger: Logger,
  ) {
    this.logger = new Logger(UserService.name);
  }

  async getUserById(id: string, { queryRunner: activeQueryRunner }: Transactional = {}): Promise<UserEntity | null> {
    try {
      return this.userRepository.findBy({ id }, { queryRunner: activeQueryRunner });
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }

  async create(
    data: CreateUserDto,
    { queryRunner: activeQueryRunner }: Transactional = {},
  ): Promise<UserEntity | null> {
    try {
      const result = await this.userRepository.create(data, {
        queryRunner: activeQueryRunner,
      });
      if (!result) {
        throw new InternalServerErrorException('Failed to create user');
      }

      return result;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
}
