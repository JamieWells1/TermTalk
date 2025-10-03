import { NextResponse } from 'next/server';
import { sessionStorage } from '@/lib/storage';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const upperCode = code.toUpperCase();

  console.log(`[GET] Looking for session ${upperCode}`);

  const session = await sessionStorage.get(upperCode);

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
