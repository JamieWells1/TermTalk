import { NextResponse } from 'next/server';
import { sessionStorage } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const { code, userName } = await request.json();

    if (!code || !userName || userName.trim() === '') {
      return NextResponse.json({ error: 'Code and display name are required' }, { status: 400 });
    }

    const upperCode = code.toUpperCase();
    const session = await sessionStorage.get(upperCode);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const userId = Math.random().toString(36).substring(7);
    session.users.push({ id: userId, name: userName.trim() });

    session.messages.push({
      user: 'SYSTEM',
      message: `${userName.trim()} joined the session`,
      timestamp: Date.now(),
    });

    await sessionStorage.set(upperCode, session);

    return NextResponse.json({ code: upperCode, userId, userName: userName.trim() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to join session' }, { status: 500 });
  }
}
