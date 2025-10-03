import { NextResponse } from 'next/server';
import { sessions } from '@/lib/sessions';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const upperCode = code.toUpperCase();

  console.log(`[GET] Looking for session ${upperCode}`);
  console.log(`[GET] Available sessions:`, Array.from(sessions.keys()));
  console.log(`[GET] Total sessions: ${sessions.size}`);

  const session = sessions.get(upperCode);

  if (!session) {
    console.log(`[GET] Session ${upperCode} not found`);
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  console.log(`[GET] Session ${upperCode} found with ${session.users.length} users`);

  return NextResponse.json({
    code: session.code,
    users: session.users,
    messageCount: session.messages.length,
  });
}
