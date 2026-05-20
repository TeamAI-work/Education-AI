import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, PenTool } from 'lucide-react';
import { useNoteSelection } from '../../../lib/useNoteSelection';
import { logActivity, updateStreak } from '../../../lib/gamification';
import { supabase } from '../../../lib/supabaseClient';
import Notes from './Notes';

import ChatHeader from './ChatHeader';
import MessageItem from './MessageItem';
import ActiveSourcesIndicator from './ActiveSourcesIndicator';
import ChatInputForm from './ChatInputForm';

// Premium Educational RAG Database
const RAG_DATABASE = {
  photosynthesis: {
    answer: "Photosynthesis is the amazing chemical reaction plants use to manufacture their food! By absorbing carbon dioxide from the air and water from the soil, plants use solar energy captured by chlorophyll (the pigment making leaves green) to synthesize glucose (sugars they consume) and release clean oxygen. The balanced chemical formula is: 6CO\u2082 + 6H\u2082O + Light energy \u2192 C\u2086H\u2081\u2082O\u2086 + 6O\u2082.",
    sources: ["Science Textbook, Ch. 3 - Plant Physiology", "National Botany Society Journals"],
    title: "Photosynthesis & Solar Energy"
  },
  space: {
    answer: "Our Solar System resides inside the Milky Way and formed about 4.6 billion years ago! It is centered around the Sun (a yellow dwarf star) and includes eight major planets. The four inner worlds (Mercury, Venus, Earth, Mars) are dense, rocky planets, while the outer four (Jupiter, Saturn, Uranus, Neptune) are massive gas or ice giants. Mars holds the record for hosting Olympus Mons, the largest volcano in the solar system!",
    sources: ["NASA Space Academy archives", "Astronomy Weekly, Issue 14"],
    title: "Solar System Secrets"
  },
  rome: {
    answer: "Ancient Rome began as a modest settlement on the Italian Peninsula in the 8th century BC and flourished into a colossal empire spanning three continents! Romans introduced lasting architectures (concrete, arches, and aqueducts) and built the Colosseum in 80 AD. Their legacy strongly shapes modern legal structures, languages (Latin roots), government representation, and engineering.",
    sources: ["World History Handbook, Vol. 2", "Roman Archaeology Reports"],
    title: "Legacy of Ancient Rome"
  },
  fractions: {
    answer: "Fractions represent parts of a whole! The top number (numerator) represents the selected parts, and the bottom number (denominator) represents the total equal parts. To add or subtract fractions, you must find a common denominator (often using the least common multiple). For multiplication, simply multiply the numerators straight across and the denominators straight across!",
    sources: ["Core Pre-Algebra Standards", "Interactive Middle School Mathematics, Ch. 5"],
    title: "Understanding Fractions"
  }
};

export default function StudyChatbot() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 'bot_init',
      sender: 'bot',
      text: "Hello! I am Aura, your RAG-powered academic helper. Ask me about **Photosynthesis**, **Space**, **Ancient Rome**, or **Fractions** to see how I retrieve textbook sources, and highlight any part of my answer to instantly save it to your notebook!",
      time: 'Just now'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeSources, setActiveSources] = useState(null);
  const [isNotebook, setIsNotebook] = useState(false)

  // Note capturing state
  const [notes, setNotes] = useState([]);
  const [successToast, setSuccessToast] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [activitiesCount, setActivitiesCount] = useState(0);

  // Selection hook
  const { selectedText, coords, showTooltip, clearSelection } = useNoteSelection();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const userId = localStorage.getItem('edu_ai_user_id');
    if (!userId) {
      navigate('/auth', { state: { from: '/level2/chatbot' } });
      return;
    }

    // Load notes from Supabase notebook_notes
    const fetchNotes = async () => {
      const { data, error } = await supabase
        .from('notebook_notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mappedNotes = data.map(row => ({
          id: row.id,
          title: row.user_annotations || 'Untitled Highlight',
          content: row.highlighted_text,
          date: new Date(row.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
          source: 'Aura AI Highlight'
        }));
        setNotes(mappedNotes);
      }
    };
    fetchNotes();
  }, []);

  const handleUpdateNotes = async (newNotes) => {
    const userId = localStorage.getItem('edu_ai_user_id');
    if (!userId) return;

    // Find which note was edited by comparing with current notes state
    const editedNote = newNotes.find((note) => {
      const original = notes.find(n => n.id === note.id);
      return original && (original.title !== note.title || original.content !== note.content);
    });

    if (editedNote) {
      const { error } = await supabase
        .from('notebook_notes')
        .update({
          user_annotations: editedNote.title,
          highlighted_text: editedNote.content
        })
        .eq('id', editedNote.id);
      
      if (!error) {
        setNotes(newNotes);
      }
    }
  };

  const handleCaptureSelection = async () => {
    if (!selectedText) return;
    const userId = localStorage.getItem('edu_ai_user_id');
    if (!userId) return;

    const title = selectedText.substring(0, 24) + (selectedText.length > 24 ? '...' : '');

    const { data, error } = await supabase
      .from('notebook_notes')
      .insert({
        user_id: userId,
        highlighted_text: selectedText,
        user_annotations: title
      })
      .select();

    if (!error && data && data[0]) {
      const row = data[0];
      const newNote = {
        id: row.id,
        title: row.user_annotations || 'Untitled Highlight',
        content: row.highlighted_text,
        date: new Date(row.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        source: 'Aura AI Highlight'
      };

      setNotes(prev => [newNote, ...prev]);
      clearSelection();
      setActivitiesCount(prev => prev + 1);

      // Trigger quick toast
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 2000);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    const timestamp = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    const userId = localStorage.getItem('edu_ai_user_id');

    // Set up user streak directly inside Supabase when first messaging the chatbot
    if (userId) {
      logActivity(userId, 'rag_query');
      updateStreak(userId);
      setActivitiesCount(prev => prev + 1);
    }


    const userMsg = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: userText,
      time: timestamp
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    setActiveSources(null);

    setTimeout(() => {
      const query = userText.toLowerCase();
      let matchedKey = null;

      if (query.includes('photo') || query.includes('plant') || query.includes('leaf') || query.includes('sunlight')) {
        matchedKey = 'photosynthesis';
      } else if (query.includes('space') || query.includes('planet') || query.includes('solar') || query.includes('star') || query.includes('mars')) {
        matchedKey = 'space';
      } else if (query.includes('rome') || query.includes('roman') || query.includes('colosseum') || query.includes('empire')) {
        matchedKey = 'rome';
      } else if (query.includes('fraction') || query.includes('math') || query.includes('numerator') || query.includes('denominator')) {
        matchedKey = 'fractions';
      }

      let botResponse = {};

      if (matchedKey) {
        const data = RAG_DATABASE[matchedKey];
        botResponse = {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: `**${data.title}**\n\n${data.answer}`,
          sources: data.sources,
          time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        };
        setActiveSources(data.sources);
      } else {
        botResponse = {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: `I couldn't find a direct RAG textbook match for "${userText}". Here is my general study advice: break your study topic down into smaller questions, query textbook chapters, and highlight key definitions to store in your Digital Notebook. Try searching for **Photosynthesis**, **Space**, **Ancient Rome**, or **Fractions** to test the source-retrieval engine!`,
          time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
        };
      }

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1200);
  };

  const deleteNote = async (id) => {
    const { error } = await supabase
      .from('notebook_notes')
      .delete()
      .eq('id', id);
    
    if (!error) {
      setNotes(prev => prev.filter(n => n.id !== id));
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
      <main className="relative z-10 flex-1 min-h-0 p-5 flex flex-col lg:flex-row gap-5 overflow-hidden">

        {/* LEFT COLUMN: Premium Chat System */}
        <motion.section
          layout
          className={`${isNotebook ? 'lg:w-[60%]' : 'lg:w-full'} w-full flex flex-col min-h-0 h-full glass rounded-lg p-5 border border-white/10 relative overflow-hidden`}
        >
          {/* Messages board */}
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

          {/* Chat Form footer */}
          <ChatInputForm 
            inputText={inputText} 
            setInputText={setInputText} 
            isTyping={isTyping} 
            onSubmit={handleSend} 
          />
        </motion.section>

        <AnimatePresence mode="popLayout">
          {isNotebook && (
            <Notes 
              notes={notes} 
              onDeleteNote={deleteNote} 
              onUpdateNotes={handleUpdateNotes} 
              activitiesCount={activitiesCount} 
            />
          )}
        </AnimatePresence>
      </main>

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