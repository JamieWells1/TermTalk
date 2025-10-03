// Global in-memory store for sessions
// Using globalThis to persist across hot reloads in development

type Session = {
  code: string;
  users: { id: string; name: string }[];
  messages: { user: string; message: string; timestamp: number }[];
  createdAt: number;
};

const globalForSessions = globalThis as unknown as {
  sessions: Map<string, Session>;
};

// Always use the same instance from globalThis
if (!globalForSessions.sessions) {
  globalForSessions.sessions = new Map<string, Session>();
}

export const sessions = globalForSessions.sessions;
