import { QueryRunner } from 'typeorm';

export type Transactional = { queryRunner?: QueryRunner };
