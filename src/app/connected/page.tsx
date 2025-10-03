'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Connected() {
  const [sessionCode, setSessionCode] = useState('');
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    console.log('[Connected] useEffect running');

    const code = localStorage.getItem('sessionCode');
    const name = localStorage.getItem('userName');
    const id = localStorage.getItem('userId');

    console.log('[Connected] localStorage values:', { code, name, id });

    if (!code || !name || !id) {
      console.log('[Connected] Missing values, redirecting to home');
      if (mounted) {
        router.push('/');
      }
      return;
    }

    console.log('[Connected] Setting state with:', { code, name, id });
    if (mounted) {
      setSessionCode(code);
      setUserName(name);
      setUserId(id);
      setIsLoading(false);

      fetchSessionInfo(code);
    }

    const interval = setInterval(() => {
      if (mounted) {
        fetchSessionInfo(code);
      }
    }, 3000);

    return () => {
      console.log('[Connected] Cleanup: clearing interval, mounted=', mounted);
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const fetchSessionInfo = async (code: string) => {
    try {
      console.log('[Connected] Fetching session info for:', code);
      const response = await fetch(`/api/sessions/${code}`);
      console.log('[Connected] Fetch response:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('[Connected] Session data:', data);
        setUsers(data.users);
      } else {
        console.error('[Connected] Failed to fetch session:', response.status);
      }
    } catch (error) {
      console.error('[Connected] Error fetching session info:', error);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('sessionCode');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    router.push('/');
  };

  const handleOpenTerminal = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const command = `curl -o /tmp/term_talk.sh ${baseUrl}/terminal.sh && TERM_TALK_URL=${baseUrl} bash /tmp/term_talk.sh ${sessionCode} ${userId}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(command);
        alert(`Terminal command copied to clipboard!\n\nPaste and run this in your terminal:\n\n${command}`);
      } else {
        showCommandModal(command);
      }
    } catch (error) {
      showCommandModal(command);
    }
  };

  const showCommandModal = (command: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = command;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
      alert(`Terminal command copied!\n\nPaste and run this in your terminal:\n\n${command}`);
    } catch (err) {
      alert(`Copy this command and run it in your terminal:\n\n${command}`);
    }

    document.body.removeChild(textarea);
  };

  const handleOpenTerminalDirect = async () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const command = `curl -s ${baseUrl}/terminal.sh | bash -s ${sessionCode} ${userId}`;

    try {
      const response = await fetch('/api/open-terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });

      if (!response.ok) {
        navigator.clipboard.writeText(command);
        alert(`Please paste this command in your terminal:\n\n${command}`);
      }
    } catch (error) {
      navigator.clipboard.writeText(command);
      alert(`Please paste this command in your terminal:\n\n${command}`);
    }
  };

  if (isLoading || !sessionCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-2xl p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Connected!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Session Code: <span className="font-mono font-bold text-xl text-blue-600 dark:text-blue-400">{sessionCode}</span>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Logged in as: {userName}
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Connected Users ({users.length})
          </h2>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-40 overflow-y-auto">
            {users.map((user) => (
              <div key={user.id} className="flex items-center py-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-900 dark:text-white">
                  {user.name}
                  {user.id === userId && ' (you)'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleOpenTerminal}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Copy Terminal Command
          </button>

          <button
            onClick={handleDisconnect}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            Disconnect
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-300">
            <strong>To start chatting:</strong> Click "Copy Terminal Command" and paste it into your terminal.
            Your friends can join using the session code: <span className="font-mono font-bold">{sessionCode}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
