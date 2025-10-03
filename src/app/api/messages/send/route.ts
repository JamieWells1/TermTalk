import { NextResponse } from 'next/server';
import { sessionStorage } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const { code, userId, message } = await request.json();

    if (!code || !userId || !message) {
      return NextResponse.json({ error: 'Code, userId, and message are required' }, { status: 400 });
    }

    const upperCode = code.toUpperCase();
    const session = await sessionStorage.get(upperCode);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const user = session.users.find(u => u.id === userId);

    if (!user) {
      return NextResponse.json({ error: 'User not in session' }, { status: 403 });
    }

    session.messages.push({
      user: user.name,
      message: message.trim(),
      timestamp: Date.now(),
    });

    // Save updated session
    await sessionStorage.set(upperCode, session);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
