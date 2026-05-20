import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Check, PenTool, PanelLeftOpen } from 'lucide-react';
import { useNoteSelection } from '../../../lib/useNoteSelection';
import { supabase } from '../../../lib/supabaseClient';
import Notes from './Notes';
import { triggerBadgeCelebration } from '../../Navigation/UnlockOverlay';

import ChatHeader from './ChatHeader';
import MessageItem from './MessageItem';
import ActiveSourcesIndicator from './ActiveSourcesIndicator';
import ChatInputForm from './ChatInputForm';
import ChatSidebar from './ChatSidebar';
import WelcomeScreen from './WelcomeScreen';
import {
  getUserId,
  fetchUserNotes,
  fetchLatestChatSession,
  createChatSession,
  fetchSessionMessages,
  updateNotebookNote,
  captureNotebookSelection,
  deleteNotebookNote,
  sendStudyMessage,
  panelTransition
} from './studyChatbotHelpers';

export default function StudyChatbot() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeSources, setActiveSources] = useState(null);
  const [isNotebook, setIsNotebook] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  // Note capturing state
  const [notes, setNotes] = useState([]);
  const [successToast, setSuccessToast] = useState(false);
  const [activitiesCount, setActivitiesCount] = useState(0);

  // Selection hook
  const { selectedText, coords, showTooltip, clearSelection } = useNoteSelection();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const userId = getUserId();
    if (!userId) {
      navigate('/auth', { state: { from: '/level2/chatbot' } });
      return;
    }

    const initializeStudyChatbot = async () => {
      const fetchedNotes = await fetchUserNotes(userId);
      setNotes(fetchedNotes);

      const latestSession = await fetchLatestChatSession(userId);

      if (latestSession?.id) {
        setCurrentSessionId(latestSession.id);
        const sessionMessages = await fetchSessionMessages(latestSession.id);
        setMessages(sessionMessages);
        return;
      }

      const newSession = await createChatSession(userId, 'New Chat');
      if (newSession?.id) {
        setCurrentSessionId(newSession.id);
      }
    };

    initializeStudyChatbot();
  }, []);

  const loadMessages = async (sessionId) => {
    setMessages([]);
    const sessionMessages = await fetchSessionMessages(sessionId);
    setMessages(sessionMessages);
  };

  const handleNewChat = async (sessionId) => {
    if (sessionId) {
      setCurrentSessionId(sessionId);
      await loadMessages(sessionId);
    } else {
      setCurrentSessionId(null);
      setMessages([]);
    }
  };

  const handleSelectSession = async (sessionId) => {
    setCurrentSessionId(sessionId);
    await loadMessages(sessionId);
  };

  const handleSuggestionClick = (text) => {
    setInputText(text);
  };

  const handleUpdateNotes = async (newNotes) => {
    const userId = getUserId();
    const updatedNotes = await updateNotebookNote({ currentNotes: notes, newNotes, userId });
    setNotes(updatedNotes);
  };

  const handleCaptureSelection = async () => {
    const newNote = await captureNotebookSelection({
      userId: getUserId(),
      selectedText
    });

    if (!newNote) return;

    setNotes((prev) => [newNote, ...prev]);
    clearSelection();
    setActivitiesCount((prev) => prev + 1);
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 2000);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    await sendStudyMessage({
      currentSessionId,
      inputText,
      setActivitiesCount,
      setCurrentSessionId,
      setMessages,
      setActiveSources,
      setInputText,
      setIsTyping
    });
  };

  const deleteNote = async (id) => {
    const wasDeleted = await deleteNotebookNote(id);

    if (wasDeleted) {
      setNotes((prev) => prev.filter((note) => note.id !== id));
    }
  };

  return (
    <div
      className="font-sans relative flex flex-col text-white bg-[#0a0f1e]"
      style={{ width: '100vw', height: '100dvh', overflow: 'hidden' }}
    >
      {/* Background decoration glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vh] rounded-full blur-[120px] opacity-15 bg-[#6666ff]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vh] rounded-full blur-[120px] opacity-10 bg-[#6666ff]" />
      </div>

      {/* Header bar */}
      <ChatHeader isNotebook={isNotebook} setIsNotebook={setIsNotebook} />

      {/* Main double column screen */}
      <LayoutGroup>
        <motion.main
          layout
          transition={panelTransition}
          className="relative z-10 flex-1 min-h-0 p-5 flex flex-col lg:flex-row gap-5 overflow-hidden"
        >
          {/* Chat Sidebar */}
          <ChatSidebar
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
            currentSessionId={currentSessionId}
            onNewChat={handleNewChat}
            onSelectSession={handleSelectSession}
            messages={messages}
          />

          {/* LEFT COLUMN: Premium Chat System */}
          <motion.section
            layout
            transition={panelTransition}
            className={`${isNotebook ? 'lg:w-[60%]' : 'lg:w-full'} w-full flex flex-col min-h-0 h-full glass rounded-lg p-5 border border-white/10 relative overflow-hidden`}
          >
            {/* Sidebar toggle button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`absolute top-3 left-3 z-20 p-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-pointer ${isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
              <PanelLeftOpen size={16} />
            </button>

            {/* Welcome Screen - shown when no messages */}
            {messages.length === 0 && !isTyping && (
              <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
            )}

            {/* Messages board - hidden on welcome screen */}
            {messages.length > 0 && (
              <>
                <div className="flex-1 min-h-0 overflow-y-auto px-1 flex flex-col gap-4 mb-4 select-text no-scrollbar">
                  {messages.map((msg) => (
                    <MessageItem key={msg.id} msg={msg} />
                  ))}

                  {isTyping && (
                    <div className="flex flex-col items-start w-full select-none">
                      <div className="flex items-center gap-1 text-[9px] font-black text-[#6666ff] uppercase tracking-wider mb-1 animate-pulse">
                        <span>Retrieving knowledge from index...</span>
                      </div>
                      <div className="bg-white/5 border border-white/5 text-white/90 p-3.5 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#6666ff] animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-[#6666ff] animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-[#6666ff] animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Active vector lookup indicator */}
                <AnimatePresence>
                  <ActiveSourcesIndicator 
                    activeSources={activeSources} 
                    setActiveSources={setActiveSources} 
                  />
                </AnimatePresence>
              </>
            )}

            {/* Chat Form footer */}
            <ChatInputForm 
              inputText={inputText} 
              setInputText={setInputText} 
              isTyping={isTyping} 
              onSubmit={handleSend} 
            />
          </motion.section>

          <AnimatePresence initial={false} mode="popLayout">
            {isNotebook && (
              <motion.div
                key="notebook-panel"
                layout
                transition={panelTransition}
                initial={{ opacity: 0, x: 28, scale: 0.98, filter: 'blur(6px)' }}
                animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: 20, scale: 0.985, filter: 'blur(4px)' }}
                className="w-full lg:w-[40%] min-h-0 h-full"
              >
                <Notes 
                  notes={notes} 
                  onDeleteNote={deleteNote} 
                  onUpdateNotes={handleUpdateNotes} 
                  activitiesCount={activitiesCount} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.main>
      </LayoutGroup>

      {/* ── FLOAT-MORPHIC HIGHLIGHT TOOLTIP BUTTON ── */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute z-50 pointer-events-auto select-none note-tooltip-btn"
            style={{
              left: `${coords.x}px`,
              top: `${coords.y}px`,
              transform: 'translateX(-50%)'
            }}
          >
            <button
              onClick={handleCaptureSelection}
              className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#6666ff] to-[#4d4dff] text-[#0a0f1e] font-black text-xs shadow-[0_4px_18px_rgba(102,102,255,0.45)] hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer border border-[#8c8cff]/30"
            >
              <PenTool size={12} /> Add to Notebook
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUCCESS CAPTURED TOAST NOTIFICATION */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#6666ff] to-[#4d4dff] text-[#0a0f1e] font-black text-xs shadow-lg flex items-center gap-2"
          >
            <Check size={14} /> Highlight saved to your Notebook!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}