import { NextResponse } from 'next/server';
import { sessionStorage } from '@/lib/storage';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { searchParams } = new URL(request.url);
  const since = searchParams.get('since');

  const { code } = await params;
  const upperCode = code.toUpperCase();
  const session = await sessionStorage.get(upperCode);

  if (!session) {
    console.log('[GET MESSAGES] Session not found:', upperCode);
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  let messages = session.messages;

  console.log('[GET MESSAGES] Total messages in session:', messages.length, 'since:', since);

  if (since) {
    const sinceTimestamp = parseInt(since);
    messages = messages.filter(m => m.timestamp > sinceTimestamp);
    console.log('[GET MESSAGES] Filtered messages:', messages.length);
  }

  return NextResponse.json({
    messages,
    users: session.users,
  });
}
