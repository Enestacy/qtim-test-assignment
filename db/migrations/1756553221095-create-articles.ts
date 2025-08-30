import { id, timestampts } from 'db/utils';
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateArticles1756553221095 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'articles',
        columns: [
          id,
          {
            name: 'author_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'title',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'published_at',
            type: 'date',
            isNullable: false,
          },
          ...timestampts,
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'articles',
      new TableForeignKey({
        columnNames: ['author_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
        name: 'FK_articles_author',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('articles', 'FK_articles_author');
    await queryRunner.dropTable('articles');
  }
}
