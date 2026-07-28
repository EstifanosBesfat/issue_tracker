'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  issue: { id: string; title: string };
}

// Falls back to this interval only if the SSE stream is unavailable
// (e.g. proxy strips streaming responses).
const FALLBACK_POLL_MS = 60_000;

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [live, setLive] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const updateDropdownPosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    setDropdownStyle({
      top: rect.bottom + 8,
      right: Math.max(8, window.innerWidth - rect.right),
      width: Math.min(320, window.innerWidth - 16),
    });
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch {
      // silently fail
    }
  }, []);

  // Initial fetch, then switch to a live SSE connection for instant push.
  // Falls back to periodic polling if the stream can't connect.
  useEffect(() => {
    setMounted(true);
    fetchNotifications();

    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let closedByCleanup = false;

    const startPolling = () => {
      if (pollInterval) return;
      pollInterval = setInterval(fetchNotifications, FALLBACK_POLL_MS);
    };

    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    const connect = () => {
      const source = new EventSource('/api/notifications/stream');

      source.addEventListener('connected', () => {
        setLive(true);
        stopPolling();
      });

      source.addEventListener('notification', (event: MessageEvent) => {
        try {
          const notification: Notification = JSON.parse(event.data);
          setNotifications((prev) => [notification, ...prev].slice(0, 20));
        } catch {
          // ignore malformed payload
        }
      });

      source.onerror = () => {
        setLive(false);
        source.close();
        startPolling();
        if (!closedByCleanup) {
          reconnectTimeout = setTimeout(connect, 5_000);
        }
      };

      return source;
    };

    const eventSource = connect();

    return () => {
      closedByCleanup = true;
      eventSource.close();
      stopPolling();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    if (!open) return;

    updateDropdownPosition();
    window.addEventListener('resize', updateDropdownPosition);
    window.addEventListener('scroll', updateDropdownPosition, true);

    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [open, updateDropdownPosition]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || dropdownRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH', body: JSON.stringify({}) });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markOneRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={buttonRef}
        onClick={() => { setOpen((v) => !v); if (!open) fetchNotifications(); }}
        className="relative flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:text-secondary hover:bg-secondary/10 transition-colors"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-danger text-danger-foreground text-[10px] font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {mounted && open && createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="fixed z-[100] bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-gray-800">Notifications</span>
              <span
                className={`flex items-center gap-1 text-[10px] font-medium ${live ? 'text-success' : 'text-gray-400'}`}
                title={live ? 'Real-time connection active' : 'Polling fallback active'}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-success animate-pulse' : 'bg-gray-300'}`} />
                {live ? 'Live' : 'Polling'}
              </span>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-secondary hover:underline font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={`/issues/${n.issue.id}`}
                  onClick={() => { markOneRead(n.id); setOpen(false); }}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${!n.read ? 'bg-secondary/5' : ''}`}
                >
                  <div className={`mt-0.5 flex-shrink-0 w-2 h-2 rounded-full ${!n.read ? 'bg-secondary' : 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.read ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                      {n.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
