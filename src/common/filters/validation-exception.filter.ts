import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    if (exceptionResponse.statusCode === 400 && Array.isArray(exceptionResponse.message)) {
      const firstError = exceptionResponse.message[0];

      return response.status(status).json({
        statusCode: status,
        message: firstError,
        error: 'Bad Request',
      });
    }

    return response.status(status).json(exceptionResponse);
  }
}
