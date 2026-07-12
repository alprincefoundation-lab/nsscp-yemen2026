import { NextRequest } from 'next/server';
import { handleArchiveGet, handleArchivePost } from '@/lib/api/archive-api';

export async function GET(request: NextRequest) {
  return handleArchiveGet(request);
}

export async function POST(request: NextRequest) {
  return handleArchivePost(request);
}
