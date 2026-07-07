import { NextResponse } from 'next/server';

const ipCache = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(ip: string, limit: number = 10, windowMs: number = 60000) {
  const now = Date.now();
  const clientData = ipCache.get(ip);

  if (!clientData || now > clientData.resetTime) {
    ipCache.set(ip, { count: 1, resetTime: now + windowMs });
    return { success: true, limit, remaining: limit - 1, resetTime: now + windowMs };
  }

  if (clientData.count >= limit) {
    return { success: false, limit, remaining: 0, resetTime: clientData.resetTime };
  }

  clientData.count++;
  return { success: true, limit, remaining: limit - clientData.count, resetTime: clientData.resetTime };
}

export function withRateLimit(handler: (...args: any[]) => any, limit: number = 10, windowMs: number = 60000) {
  return async (request: Request, ...args: any[]) => {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const limitResult = rateLimit(ip, limit, windowMs);

    if (!limitResult.success) {
      return NextResponse.json(
        { success: false, error: 'تم تجاوز الحد المسموح به من الطلبات لأسباب أمنية. يرجى الانتظار.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': limitResult.resetTime.toString()
          }
        }
      );
    }

    const response = await handler(request, ...args);

    if (response instanceof Response) {
      response.headers.set('X-RateLimit-Limit', limit.toString());
      response.headers.set('X-RateLimit-Remaining', limitResult.remaining.toString());
      response.headers.set('X-RateLimit-Reset', limitResult.resetTime.toString());
    }

    return response;
  };
}
