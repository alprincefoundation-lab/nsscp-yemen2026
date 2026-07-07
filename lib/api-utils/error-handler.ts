import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function withErrorHandler(handler: (...args: any[]) => any) {
  return async (request: Request, ...args: any[]) => {
    try {
      return await handler(request, ...args);
    } catch (error: any) {
      console.error('API Error Handler:', error);

      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: 'بيانات المدخلات غير صالحة للعملية الأمنية.',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          },
          { status: 400 }
        );
      }

      const statusMap: Record<string, number> = {
        'Unauthorized': 401,
        'Forbidden': 403,
        'NotFound': 404
      };

      const status = statusMap[error.message] || 500;
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'حدث خطأ داخلي في المنظومة.'
        },
        { status }
      );
    }
  };
}
