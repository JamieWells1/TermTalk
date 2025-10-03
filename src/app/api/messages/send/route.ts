import { NextResponse } from 'next/server';
import { sessionStorage } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const { code, userId, message } = await request.json();

    console.log('[SEND] Received message:', { code, userId, messageLength: message?.length });

    if (!code || !userId || !message) {
      return NextResponse.json({ error: 'Code, userId, and message are required' }, { status: 400 });
    }

    const upperCode = code.toUpperCase();
    const session = await sessionStorage.get(upperCode);

    console.log('[SEND] Session retrieved:', session ? `Found with ${session.messages.length} messages` : 'Not found');

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const user = session.users.find(u => u.id === userId);

    if (!user) {
      console.log('[SEND] User not found in session:', { userId, sessionUsers: session.users.map(u => u.id) });
      return NextResponse.json({ error: 'User not in session' }, { status: 403 });
    }

    const newMessage = {
      user: user.name,
      message: message.trim(),
      timestamp: Date.now(),
    };

    session.messages.push(newMessage);

    console.log('[SEND] Added message, total messages:', session.messages.length);

    // Save updated session
    await sessionStorage.set(upperCode, session);

    console.log('[SEND] Session saved successfully');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[SEND] Error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
