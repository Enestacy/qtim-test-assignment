import { FindOptionsWhere, Equal, Not, ILike, LessThan, LessThanOrEqual, MoreThan, MoreThanOrEqual, In } from 'typeorm';
import { FilterConditionDto as FilterCondition } from '../filter.dto';

type OperatorHandler = (value: any) => any;

const operators: Record<string, OperatorHandler> = {
  equals: value => Equal(value),
  in: value => In(value),
  notIn: value => Not(In(value)),
  lt: value => LessThan(value),
  lte: value => LessThanOrEqual(value),
  gt: value => MoreThan(value),
  gte: value => MoreThanOrEqual(value),
  contains: value => ILike(`%${value}%`),
  startsWith: value => ILike(`${value}%`),
  endsWith: value => ILike(`%${value}`),
  ltDate: value => LessThan(new Date(value)),
  lteDate: value => LessThanOrEqual(new Date(value)),
  gtDate: value => MoreThan(new Date(value)),
  gteDate: value => MoreThanOrEqual(new Date(value)),
};

export function buildWhereCondition<T>(
  where: Partial<{ [key in keyof T]: FilterCondition }> | undefined,
): FindOptionsWhere<T> {
  if (!where) {
    return {};
  }

  const conditions: FindOptionsWhere<T> = {};
  console.log('where', where);
  for (const [key, filter] of Object.entries(where)) {
    console.log('filter', filter);
    console.log('key', key);
    if (!filter) continue;

    const operator = Object.keys(operators).find(op => filter[op] !== undefined);

    if (operator) {
      const value = filter[operator];

      if ((operator === 'in' || operator === 'notIn') && (!Array.isArray(value) || value.length === 0)) {
        continue;
      }

      conditions[key] = operators[operator](value) as any;
    }
  }

  return conditions;
}

export function buildOrderByCondition<T>(orderBy: Partial<{ [key in keyof T]: 'asc' | 'desc' }> | undefined): {
  [key: string]: 'ASC' | 'DESC';
} {
  if (!orderBy) {
    return { createdAt: 'DESC' };
  }

  const order: { [key: string]: 'ASC' | 'DESC' } = {};

  for (const [key, direction] of Object.entries(orderBy)) {
    const typedDirection = direction as 'asc' | 'desc';
    order[key] = typedDirection.toUpperCase() as 'ASC' | 'DESC';
  }

  return order;
}
