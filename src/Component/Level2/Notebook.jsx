import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Search, Trash2, Edit3, Plus, Check, X, FileText } from 'lucide-react';

export default function Notebook({ notes = [], onUpdateNotes, onAddActivity }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  // Handle adding a manual note
  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newNote = {
      id: `manual_${Date.now()}`,
      title: newTitle.trim(),
      content: newContent.trim(),
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      source: 'Manual entry'
    };

    const updated = [newNote, ...notes];
    onUpdateNotes(updated);
    
    // Clear inputs & toggle state
    setNewTitle('');
    setNewContent('');
    setIsAdding(false);
    
    if (onAddActivity) onAddActivity();
  };

  // Handle deleting a note
  const handleDeleteNote = (id) => {
    const updated = notes.filter(n => n.id !== id);
    onUpdateNotes(updated);
  };

  // Trigger editing state
  const startEdit = (note) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  // Save edited note
  const saveEdit = (id) => {
    const updated = notes.map(n => {
      if (n.id === id) {
        return {
          ...n,
          title: editTitle.trim(),
          content: editContent.trim()
        };
      }
      return n;
    });
    onUpdateNotes(updated);
    setEditingId(null);
  };

  // Filter notes based on query
  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (note.source && note.source.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="glass rounded-3xl p-5 border border-white/10 flex flex-col h-full select-none overflow-hidden relative">
      {/* Background radial glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-15 bg-[#6666ff] pointer-events-none" />

      {/* Header section */}
      <div className="flex items-center justify-between flex-shrink-0 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[#6666ff]/10 flex items-center justify-center border border-[#6666ff]/25">
            <BookOpen size={20} className="text-[#6666ff]" />
          </div>
          <div>
            <h3 className="text-white font-black text-base leading-tight">Digital Notebook</h3>
            <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider">Review & organize ideas</p>
          </div>
        </div>

        {/* Add note toggle */}
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer
            ${isAdding 
              ? 'bg-red-500/10 border-red-500/35 text-red-400 hover:bg-red-500/20' 
              : 'bg-[#6666ff]/10 border-[#6666ff]/25 text-[#6666ff] hover:bg-[#6666ff]/20'
            }`}
        >
          {isAdding ? <X size={16} /> : <Plus size={16} />}
        </button>
      </div>

      {/* Search note bar */}
      {!isAdding && (
        <div className="relative flex-shrink-0 mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
          <input
            type="text"
            placeholder="Search saved notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/20 border border-white/5 focus:border-[#6666ff]/40 focus:ring-1 focus:ring-[#6666ff]/40 outline-none rounded-xl py-2 pl-10 pr-4 text-white text-xs font-medium placeholder-white/20 transition-all"
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 select-text">
        <AnimatePresence mode="wait">
          {isAdding ? (
            /* manual add note form */
            <motion.form
              key="add-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleAddNote}
              className="flex flex-col gap-3 h-full justify-between"
            >
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Note Topic (e.g. Photosynthesis)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-black/25 border border-white/5 focus:border-[#6666ff]/40 outline-none rounded-xl py-2.5 px-3.5 text-white text-xs font-black placeholder-white/20"
                  required
                />
                
                <textarea
                  placeholder="Type your notes here or capture highlighted text from the chatbot..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={6}
                  className="w-full bg-black/25 border border-white/5 focus:border-[#6666ff]/40 outline-none rounded-xl py-2.5 px-3.5 text-white text-xs font-medium placeholder-white/20 resize-none leading-relaxed"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#6666ff] text-[#0a0f1e] font-black text-xs hover:bg-[#5252e0] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_4px_12px_rgba(102,102,255,0.25)]"
              >
                <Check size={14} /> Add to Notebook
              </button>
            </motion.form>
          ) : (
            /* notes list */
            <motion.div
              key="notes-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-3 pb-3"
            >
              {filteredNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center select-none">
                  <FileText size={36} className="text-white/10 mb-2.5" />
                  <p className="text-white/40 text-xs font-bold">No notes found</p>
                  <p className="text-white/20 text-[10px] max-w-[180px] mt-1 leading-normal">
                    Highlight text in the chatbot or click "+" to log study notes.
                  </p>
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    layout
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors flex flex-col gap-2 relative overflow-hidden group"
                  >
                    {editingId === note.id ? (
                      /* note editing view */
                      <div className="flex flex-col gap-2 select-text">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-white text-xs font-black outline-none focus:border-[#6666ff]"
                        />
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          className="bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-white text-xs font-medium outline-none focus:border-[#6666ff] resize-none leading-relaxed"
                        />
                        <div className="flex justify-end gap-1.5 mt-1 select-none">
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 px-2.5 rounded-lg bg-white/5 border border-white/5 text-white/50 text-[10px] font-bold hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveEdit(note.id)}
                            className="p-1 px-2.5 rounded-lg bg-[#6666ff] text-[#0a0f1e] text-[10px] font-black hover:bg-[#5252e0] transition-colors cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* standard static card view */
                      <>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex flex-col gap-0.5">
                            <h4 className="text-white font-black text-xs leading-snug">{note.title}</h4>
                            <span className="text-[9px] text-white/30 font-bold uppercase tracking-wide">
                              {note.date} • {note.source || 'Study capture'}
                            </span>
                          </div>

                          {/* actions panel */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity select-none flex-shrink-0">
                            <button
                              onClick={() => startEdit(note)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-[#6666ff]/20 text-white/40 hover:text-[#6666ff] transition-all cursor-pointer"
                              title="Edit note"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all cursor-pointer"
                              title="Delete note"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <p className="text-white/60 text-[11px] font-medium leading-relaxed break-words">
                          {note.content}
                        </p>
                      </>
                    )}
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}