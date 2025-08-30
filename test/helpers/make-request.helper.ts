import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
export type TMakeRequestOptions = {
  app: INestApplication;
  method: RequestMethod;
  route: string;
  expectedStatus: number;
  body?: any;
  expectedResponse?: any;
  headers?: Record<string, any>;
};
export async function makeRequest({
  app,
  method,
  route,
  expectedStatus,
  body,
  expectedResponse,
  headers = {},
}: TMakeRequestOptions) {
  let req = request(app.getHttpServer())[method.toLowerCase()](route);

  req = req.set({
    'Content-Type': 'application/json',
    ...headers,
  });

  if (body) {
    req = req.send(body);
  }

  req = req.expect(expectedStatus);

  if (expectedResponse) {
    req = req.expect(({ body }) => {
      expect(body).toMatchObject(expectedResponse);
    });
  }

  return req;
}
