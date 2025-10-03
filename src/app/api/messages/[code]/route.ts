import { NextResponse } from 'next/server';
import { sessions } from '@/lib/sessions';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { searchParams } = new URL(request.url);
  const since = searchParams.get('since');

  const { code } = await params;
  const session = sessions.get(code.toUpperCase());

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  let messages = session.messages;

  // Filter messages since timestamp if provided
  if (since) {
    const sinceTimestamp = parseInt(since);
    messages = messages.filter(m => m.timestamp > sinceTimestamp);
  }

  return NextResponse.json({
    messages,
    users: session.users,
  });
}
