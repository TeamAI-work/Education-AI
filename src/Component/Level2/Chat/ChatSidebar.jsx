import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, MessageSquare, Trash2, X, MoreVertical, Edit2 } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

export default function ChatSidebar({ isOpen, setIsOpen, currentSessionId, onNewChat, onSelectSession, messages = [] }) {
  const [sessions, setSessions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasEmptySession, setHasEmptySession] = useState(false);
  const [isModel, setIsModel] = useState();

  // Management Modal states
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedManageSession, setSelectedManageSession] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (messages && messages.length > 0 && currentSessionId) {
      // Find first user message to rename the chat title if it's currently 'New Chat'
      const firstUserMsg = messages.find(m => m.sender === 'user');
      const newTitle = firstUserMsg ? firstUserMsg.text.substring(0, 30) : 'New Chat';

      setSessions(prev => {
        const currentSession = prev.find(s => s.id === currentSessionId);

        const updatedSessions = prev.map(s => {
          if (s.id === currentSessionId) {
            const hasMessagesNow = messages.length > 0;
            const newMsgArray = hasMessagesNow ? [{ id: 'dummy' }] : [];
            const titleToUse = s.title === 'New Chat' && firstUserMsg ? newTitle : s.title;
            return { ...s, title: titleToUse, chat_messages: newMsgArray };
          }
          return s;
        });

        const hasAnyEmptyChat = updatedSessions.some(s => !s.chat_messages || s.chat_messages.length === 0);
        setHasEmptySession(hasAnyEmptyChat);

        if (currentSession && currentSession.title === 'New Chat' && firstUserMsg) {
          // Update in Supabase in background
          supabase
            .from('chat_sessions')
            .update({ title: newTitle })
            .eq('id', currentSessionId)
            .then(({ error }) => {
              if (error) {
                console.error('Failed to update session title:', error);
              }
            });
        }

        return updatedSessions;
      });
    } else if (messages && messages.length === 0 && currentSessionId) {
      setSessions(prev => {
        const updatedSessions = prev.map(s => {
          if (s.id === currentSessionId) {
            return { ...s, chat_messages: [] };
          }
          return s;
        });
        const hasAnyEmptyChat = updatedSessions.some(s => !s.chat_messages || s.chat_messages.length === 0);
        setHasEmptySession(hasAnyEmptyChat);
        return updatedSessions;
      });
    }
  }, [messages, currentSessionId]);

  const fetchSessions = async () => {
    const userId = localStorage.getItem('edu_ai_user_id');
    if (!userId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('chat_sessions')
      .select(`
        id,
        title,
        created_at,
        document_id,
        chat_messages (
          id
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSessions(data);
      const hasAnyEmptyChat = data.some(s => !s.chat_messages || s.chat_messages.length === 0);
      setHasEmptySession(hasAnyEmptyChat);
    }
    setLoading(false);
  };

  const handleNewChat = async () => {
    if (hasEmptySession) return;

    const userId = localStorage.getItem('edu_ai_user_id');
    if (!userId) return;

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({ user_id: userId, title: 'New Chat' })
      .select()
      .single();

    if (!error && data) {
      const newSessionLocal = { ...data, chat_messages: [] };
      setSessions(prev => [newSessionLocal, ...prev]);
      setHasEmptySession(true);
      onNewChat(data.id);
    }
  };

  const handleDeleteSession = async (sessionId, e) => {
    if (e) e.stopPropagation();

    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);

    if (!error) {
      setSessions(prev => {
        const remaining = prev.filter(s => s.id !== sessionId);
        const hasAnyEmptyChat = remaining.some(s => !s.chat_messages || s.chat_messages.length === 0);
        setHasEmptySession(hasAnyEmptyChat);
        return remaining;
      });
      if (sessionId === currentSessionId) {
        onNewChat(null);
      }
    }
  };

  const handleSaveRename = async () => {
    if (!selectedManageSession || !editTitle.trim()) return;

    setIsSaving(true);
    const trimmedTitle = editTitle.trim();

    const { error } = await supabase
      .from('chat_sessions')
      .update({ title: trimmedTitle })
      .eq('id', selectedManageSession.id);

    if (!error) {
      setSessions(prev =>
        prev.map(s => (s.id === selectedManageSession.id ? { ...s, title: trimmedTitle } : s))
      );
      setShowManageModal(false);
      setSelectedManageSession(null);
    } else {
      console.error('Failed to rename session:', error);
    }
    setIsSaving(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedManageSession) return;

    setIsSaving(true);
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', selectedManageSession.id);

    if (!error) {
      setSessions(prev => {
        const remaining = prev.filter(s => s.id !== selectedManageSession.id);
        const hasAnyEmptyChat = remaining.some(s => !s.chat_messages || s.chat_messages.length === 0);
        setHasEmptySession(hasAnyEmptyChat);
        return remaining;
      });
      if (selectedManageSession.id === currentSessionId) {
        onNewChat(null);
      }
      setShowManageModal(false);
      setSelectedManageSession(null);
    } else {
      console.error('Failed to delete session:', error);
    }
    setIsSaving(false);
  };

  const filteredSessions = sessions.filter(session =>
    session.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="flex-shrink-0 h-full overflow-hidden"
          >
            <div className="w-[280px] h-full flex flex-col glass border-r border-white/10 bg-[#0a0f1e]/80 backdrop-blur-xl pb-2">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <h2 className="text-sm font-bold text-white/90">Chat History</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* New Chat Button */}
              <div className="px-3 py-3">
                <button
                  onClick={handleNewChat}
                  disabled={hasEmptySession}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all cursor-pointer shadow-[0_4px_18px_rgba(102,102,255,0.3)] bg-gradient-to-r from-[#6666ff] to-[#4d4dff] text-[#0a0f1e] hover:scale-[1.02] active:scale-[0.98]`}
                >
                  <Plus size={16} />
                  New Chat
                </button>
              </div>

              {/* Search Input */}
              <div className="px-3 pb-3">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search chats..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/90 text-sm placeholder:text-white/30 focus:outline-none focus:border-[#6666ff]/50 focus:bg-white/8 transition-all"
                  />
                </div>
              </div>

              {/* Chat List */}
              <div className="flex-1 overflow-y-auto px-2 pb-3 no-scrollbar">
                {loading ? (
                  <div className="flex flex-col gap-2 px-2 py-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
                    ))}
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-white/40">
                    <MessageSquare size={24} className="mb-2 opacity-50" />
                    <p className="text-xs font-medium">
                      {searchQuery ? 'No matching chats' : 'No chats yet'}
                    </p>
                    <p className="text-[10px] mt-1">
                      {searchQuery ? 'Try a different search' : 'Start a new conversation'}
                    </p>

                    {isModel &&
                      <div>

                      </div>
                    }
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {filteredSessions.map((session) => (
                      <motion.div
                        key={session.id}
                        layout
                        onClick={() => onSelectSession(session.id)}
                        className={`group relative flex flex-col gap-1 px-3 py-2.5 rounded-lg cursor-pointer transition-all border ${session.id === currentSessionId
                          ? 'bg-[#6666ff]/15 border-[#6666ff]/30'
                          : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/5'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-white/90 truncate flex-1">
                            {session.title || 'Untitled Chat'}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedManageSession(session);
                              setEditTitle(session.title || 'Untitled Chat');
                              setShowDeleteConfirm(false);
                              setShowManageModal(true);
                            }}
                            className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition-all cursor-pointer flex-shrink-0 ${session.id === currentSessionId ? 'opacity-60' : ''
                              }`}
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>
                        <span className="text-[10px] text-white/40 font-medium">
                          {formatDate(session.created_at)}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Manage Session Modal Overlay */}
      <AnimatePresence>
        {showManageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              if (!isSaving) {
                setShowManageModal(false);
                setSelectedManageSession(null);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 240, damping: 28 }}
              className="bg-[#0a0f1e]/95 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-[0_0_50px_rgba(102,102,255,0.15)] backdrop-blur-xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative top blur glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-10 bg-[#6666ff]/20 blur-2xl rounded-full pointer-events-none" />

              {!showDeleteConfirm ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Edit2 size={16} className="text-[#6666ff]" />
                      Rename Chat
                    </h3>
                    <button
                      onClick={() => {
                        setShowManageModal(false);
                        setSelectedManageSession(null);
                      }}
                      className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider block mb-1.5">
                    Chat Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Enter chat title..."
                    className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#6666ff]/50 focus:bg-white/8 transition-all text-sm mb-6"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveRename();
                      }
                    }}
                    autoFocus
                  />

                  <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-3.5 py-2 rounded-lg text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/10 transition-all font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 size={12} />
                      Delete Chat
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowManageModal(false);
                          setSelectedManageSession(null);
                        }}
                        className="px-4 py-2 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/5 transition-all font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveRename}
                        disabled={isSaving || !editTitle.trim()}
                        className="px-4 py-2 rounded-lg text-xs bg-gradient-to-r from-[#6666ff] to-[#4d4dff] text-[#0a0f1e] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none transition-all font-bold cursor-pointer"
                      >
                        {isSaving ? 'Saving...' : 'Save Title'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
                      <Trash2 size={16} />
                      Delete Chat?
                    </h3>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <p className="text-xs text-white/70 leading-relaxed mb-6">
                    Are you sure you want to delete <span className="font-semibold text-white">"{selectedManageSession?.title || 'this chat'}"</span>?
                    This will permanently delete all messages and cannot be undone.
                  </p>

                  <div className="flex justify-end gap-2 border-t border-white/5 pt-4 mt-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/5 transition-all font-semibold cursor-pointer"
                    >
                      Go Back
                    </button>
                    <button
                      onClick={handleConfirmDelete}
                      disabled={isSaving}
                      className="px-4 py-2 rounded-lg text-xs bg-red-500 hover:bg-red-600 text-white transition-all font-bold flex items-center gap-1.5 cursor-pointer shadow-[0_4px_18px_rgba(239,68,68,0.3)] disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isSaving ? 'Deleting...' : 'Permanently Delete'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
