import { NextResponse } from 'next/server';
import { sessions } from '@/lib/sessions';

// Generate random 6-character code
function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(request: Request) {
  try {
    const { userName } = await request.json();

    if (!userName || userName.trim() === '') {
      return NextResponse.json({ error: 'Display name is required' }, { status: 400 });
    }

    const code = generateCode();
    const userId = Math.random().toString(36).substring(7);

    const sessionData = {
      code,
      users: [{ id: userId, name: userName.trim() }],
      messages: [],
      createdAt: Date.now(),
    };

    sessions.set(code, sessionData);

    console.log(`[CREATE] Session ${code} created. Total sessions: ${sessions.size}`);
    console.log(`[CREATE] Sessions map:`, Array.from(sessions.keys()));

    return NextResponse.json({ code, userId, userName: userName.trim() });
  } catch (error) {
    console.error('[CREATE] Error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
