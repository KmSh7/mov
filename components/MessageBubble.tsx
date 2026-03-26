'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  text: string;
  timestamp: number;
  edited: boolean;
  replyTo: string | null;
  user?: string;
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  user: string;
  theme?: 'pink' | 'blue';
  onEdit: (messageId: string, newText: string) => void;
  onDelete: (messageId: string) => void;
  onReply: (messageId: string) => void;
  getReplyMessage?: (replyTo: string) => Message | undefined;
}

export default function MessageBubble({
  message,
  isOwn,
  user,
  theme = 'blue',
  onEdit,
  onDelete,
  onReply,
  getReplyMessage
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [showActions, setShowActions] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [isEditing]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== message.text) {
      onEdit(message.id, editText.trim());
    }
    setIsEditing(false);
    setEditText(message.text);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(message.text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const isPink = theme === 'pink';
  const ownBubbleColor = isPink 
    ? 'from-pink-500 to-rose-500' 
    : 'from-orange-500 to-orange-600';
  const ownTextColor = isPink ? 'text-pink-100' : 'text-orange-100';
  const replyBorder = isPink ? 'border-pink-400' : 'border-orange-400';

  // Determine bubble color based on who sent the message
  const getBubbleColor = (msgUser: string | undefined) => {
    if (msgUser === 'olivia') {
      return 'from-pink-500 to-rose-500';
    }
    return 'from-orange-500 to-orange-600';
  };

  const getTextColor = (msgUser: string | undefined) => {
    if (msgUser === 'olivia') {
      return 'text-pink-100';
    }
    return 'text-orange-100';
  };

  const getReplyBorderColor = (msgUser: string | undefined) => {
    if (msgUser === 'olivia') {
      return 'border-pink-400';
    }
    return 'border-orange-400';
  };

  const bubbleColor = getBubbleColor(message.user);
  const textColor = getTextColor(message.user);
  const borderColor = getReplyBorderColor(message.user);

  const replyMessage = message.replyTo ? getReplyMessage?.(message.replyTo) : null;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3 group`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 relative transition-all duration-200 ${isOwn ? `bg-gradient-to-r ${bubbleColor} text-white rounded-br-md` : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-md'} ${message.edited ? 'opacity-90' : ''}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Reply preview */}
        {replyMessage && (
          <div className={`mb-2 pb-2 border-b ${isOwn ? borderColor : 'border-gray-300 dark:border-gray-600'} text-sm opacity-80`}>
            <span className="font-semibold text-xs">
              {replyMessage.text.substring(0, 25)}...
            </span>
          </div>
        )}

        {/* Message text */}
        {isEditing ? (
          <div className="flex gap-2">
            <input
              ref={editInputRef}
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-white/20 text-white placeholder-white/60 px-2 py-1 rounded outline-none flex-1 text-sm"
            />
            <button
              onClick={handleSaveEdit}
              className="text-xs hover:bg-white/20 px-2 py-1 rounded"
            >
              ✓
            </button>
            <button
              onClick={handleCancelEdit}
              className="text-xs hover:bg-white/20 px-2 py-1 rounded"
            >
              ✕
            </button>
          </div>
        ) : (
          <p className="text-sm md:text-base break-words">{message.text}</p>
        )}

        {/* Timestamp and edited label */}
        <div className={`flex items-center gap-2 mt-1 text-xs ${isOwn ? textColor : 'text-gray-500 dark:text-gray-400'}`}>
          <span>{formatTime(message.timestamp)}</span>
          {message.edited && <span className="italic">(edited)</span>}
        </div>

        {/* Action buttons */}
        {showActions && !isEditing && (
          <div className={`absolute ${isOwn ? '-left-24' : '-right-24'} top-0 flex gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-1.5`}>
            <button
              onClick={() => onReply(message.id)}
              className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Reply"
            >
              ↩️
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Edit"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(message.id)}
              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Delete"
            >
              🗑️
            </button>
          </div>
        )}
      </div>
    </div>
  );
}