'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import MessageBubble from './MessageBubble';

interface Message {
  id: string;
  text: string;
  timestamp: number;
  edited: boolean;
  replyTo: string | null;
  user?: string;
}

interface ChatBoxProps {
  user: string;
  theme?: 'pink' | 'blue';
}

export default function ChatBox({ user, theme = 'blue' }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch messages every 1.5 seconds
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/chat');
        const data: Message[] = await response.json();
        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 1500);
    return () => clearInterval(interval);
  }, []);

  // Track previous message count using ref to avoid ESLint warning
  const prevMessageCountRef = useRef(0);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Auto-scroll to bottom only when NEW messages arrive (not on initial load)
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current && prevMessageCountRef.current > 0) {
      // New message arrived - scroll to bottom
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessageCountRef.current = messages.length;
  }, [messages]);

  // Show scroll button when user scrolls up
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
    setShowScrollButton(!isAtBottom);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollButton(false);
  };

  // Simulate typing indicator
  useEffect(() => {
    const checkTyping = () => {
      setIsTyping(Math.random() > 0.7);
    };
    const interval = setInterval(checkTyping, 3000);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newMessage.trim(),
          user,
          replyTo
        })
      });

      setNewMessage('');
      setReplyTo(null);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleEdit = async (messageId: string, newText: string) => {
    try {
      await fetch('/api/chat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          text: newText,
          user
        })
      });
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await fetch(`/api/chat?messageId=${messageId}&user=${user}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleReply = (messageId: string) => {
    setReplyTo(messageId);
    inputRef.current?.focus();
  };

  const getReplyMessage = useCallback((replyTo: string) => {
    return messages.find(m => m.id === replyTo);
  }, [messages]);

  const isPink = theme === 'pink';
  const headerGradient = isPink 
    ? 'from-pink-600 to-rose-600' 
    : 'from-blue-600 to-cyan-600';
  const headerText = isPink ? 'Olivia&apos;s Watch Party' : 'Kumar&apos;s Watch Party';

  const isOwnMessage = (msgUser: string | undefined) => msgUser === user;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Chat Header */}
      <div className={`px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r ${headerGradient}`}>
        <div className="flex items-center gap-2">
          <span className="text-xl">💬</span>
          <h3 className="font-bold text-white text-base">Chat</h3>
        </div>
        <p className="text-gray-400 text-xs">
          {headerText}
        </p>
      </div>

      {/* Messages Area - with scroll detection and manual scroll button */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50 dark:bg-gray-900 relative"
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p className="text-4xl mb-2">💬</p>
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={isOwnMessage(msg.user)}
              user={user}
              theme={theme}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReply={handleReply}
              getReplyMessage={getReplyMessage}
            />
          ))
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button - shows when user scrolls up */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-4 bg-orange-500 hover:bg-orange-600 text-white rounded-full p-3 shadow-lg transition-all animate-bounce"
          title="Scroll to bottom"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}

      {/* Reply preview */}
      {replyTo && (
        <div className="px-4 py-2 bg-orange-50 dark:bg-orange-900/20 border-t border-orange-200 dark:border-orange-800 flex items-center justify-between">
          <div className="text-sm">
            <span className="text-orange-600 dark:text-orange-400 font-medium">Replying to message</span>
            <p className="text-gray-500 dark:text-gray-400 text-xs truncate">
              {getReplyMessage(replyTo)?.text}
            </p>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:border-orange-500 focus:outline-none dark:bg-gray-700 dark:text-white transition-colors"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="px-4 py-2 rounded-lg font-medium bg-orange-500 hover:bg-orange-600 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}