import { Injectable, Logger } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { UserEntity } from './user.entity';
import { DataSource, FindOptionsWhere } from 'typeorm';
import { Transactional } from 'src/common/types';
import { getRepository } from 'src/common/helpers';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly datasource: DataSource,
    private readonly logger: Logger,
  ) {
    this.logger = new Logger(UserRepository.name);
  }

  async findBy(
    data: FindOptionsWhere<UserEntity>,
    { queryRunner: activeQueryRunner }: Transactional = {},
  ): Promise<UserEntity | null> {
    try {
      const userRepository = getRepository(activeQueryRunner ?? this.datasource, UserEntity);
      return userRepository.findOne({
        where: data,
        withDeleted: false,
      });
    } catch (error) {
      this.logger.error(error.message);
      return null;
    }
  }

  async create(
    data: Partial<UserEntity>,
    { queryRunner: activeQueryRunner }: Transactional = {},
  ): Promise<UserEntity | null> {
    try {
      const userRepository = getRepository(activeQueryRunner ?? this.datasource, UserEntity);
      const userData = userRepository.create(data);
      return userRepository.save(userData);
    } catch (error) {
      this.logger.error(error.message);
      return null;
    }
  }
}
