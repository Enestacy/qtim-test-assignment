import { plainToInstance } from 'class-transformer';

export function parseCachedData<T>(data: string, dtoClass: new () => T): T | null {
  try {
    const parsedData = JSON.parse(data);
    const dtoInstance = plainToInstance(dtoClass, parsedData);

    return dtoInstance;
  } catch (error) {
    return null;
  }
}
