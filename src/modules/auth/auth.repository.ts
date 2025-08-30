import { Injectable, Logger } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { AuthEntity } from './auth.entity';
import { DataSource, FindOptionsWhere, UpdateResult } from 'typeorm';
import { Transactional } from 'src/common/types';
import { getRepository } from 'src/common/helpers';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectRepository(AuthEntity)
    private readonly datasource: DataSource,
    private readonly logger: Logger,
  ) {
    this.logger = new Logger(AuthRepository.name);
  }

  async findOneBy(
    data: FindOptionsWhere<AuthEntity>,
    { queryRunner: activeQueryRunner }: Transactional = {},
  ): Promise<AuthEntity | null> {
    try {
      const userRepository = getRepository(activeQueryRunner ?? this.datasource, AuthEntity);
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
    data: Partial<AuthEntity>,
    { queryRunner: activeQueryRunner }: Transactional = {},
  ): Promise<AuthEntity | null> {
    try {
      const userRepository = getRepository(activeQueryRunner ?? this.datasource, AuthEntity);
      const userData = userRepository.create(data);
      const savedUser = await userRepository.save(userData);
      return savedUser;
    } catch (error) {
      this.logger.error(error.message);
      return null;
    }
  }

  async update(
    where: FindOptionsWhere<AuthEntity>,
    data: Partial<AuthEntity>,
    { queryRunner: activeQueryRunner }: Transactional = {},
  ): Promise<UpdateResult | null> {
    try {
      const authRepository = getRepository(activeQueryRunner ?? this.datasource, AuthEntity);
      return authRepository.update(where, data);
    } catch (error) {
      this.logger.error(error.message);
      return null;
    }
  }
}
