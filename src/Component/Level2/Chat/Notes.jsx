import { useState, useEffect } from 'react';
import { logActivity } from '../../../lib/gamification';
import { motion } from 'framer-motion';
import { BookOpen, PenTool, Trash2 } from 'lucide-react';

export default function Notes({ notes = [], onDeleteNote, onUpdateNotes, activitiesCount = 0 }) {
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const userId = localStorage.getItem('edu_ai_user_id');

    // Refresh notes when activitiesCount increments (RAG queries or notebook saves)
    useEffect(() => {
        if (notes.length > 0 && userId) {
            logActivity(userId, 'level2_study');
        }
    }, [notes.length, userId]);

    const startEditing = (note) => {
        setEditingNoteId(note.id);
        setEditTitle(note.title);
        setEditContent(note.content);
    };

    const saveEdit = (noteId) => {
        const updated = notes.map(n => {
            if (n.id === noteId) {
                return { ...n, title: editTitle, content: editContent };
            }
            return n;
        });
        if (onUpdateNotes) {
            onUpdateNotes(updated);
        }
        setEditingNoteId(null);
    };

    return (
        <motion.section
            layout
            initial={{ opacity: 0, x: 150 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 150 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="lg:w-[40%] w-full flex flex-col gap-5 min-h-0 h-full select-none">

            {/* Quick Realtime Capture Notebook Widget */}
            <div className="flex-1 glass rounded-lg p-5 border border-white/10 flex flex-col min-h-0">
                <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white uppercase tracking-wider">Workspace Notebook</span>
                    </div>
                    <span className="text-[9px] text-[#6666ff] bg-[#6666ff]/10 border border-[#6666ff]/30 font-black px-2 py-0.5 rounded-full uppercase">
                        {notes.length} Notes
                    </span>
                </div>

                {/* Note logs list */}
                <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-2.5 select-text">
                    {notes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-10 text-center select-none">
                            <BookOpen size={30} className="text-white/10 mb-2" />
                            <div className="text-[11px] text-white/35 font-bold">No captures found</div>
                            <div className="text-[9px] text-white/20 max-w-[170px] mt-1 leading-normal">
                                Highlight text in Aura's replies to save key facts instantly.
                            </div>
                        </div>
                    ) : (
                        notes.map((note) => {
                            const isEditing = editingNoteId === note.id;
                            return (
                                <div
                                    key={note.id}
                                    className="p-3 rounded-lg bg-white/5 border border-white/5 flex flex-col gap-1.5 relative group hover:border-[#6666ff]/20 transition-all select-text"
                                >
                                    {isEditing ? (
                                        <div className="flex flex-col gap-2 w-full">
                                            <input
                                                type="text"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] text-white font-bold focus:border-[#6666ff]/50 outline-none"
                                                placeholder="Edit Title"
                                            />
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                rows={3}
                                                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] text-white/80 focus:border-[#6666ff]/50 outline-none resize-none"
                                                placeholder="Edit Content"
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => setEditingNoteId(null)}
                                                    className="px-2 py-1 rounded bg-white/5 text-white/50 text-[9px] font-black hover:bg-white/10 cursor-pointer"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => saveEdit(note.id)}
                                                    className="px-2 py-1 rounded bg-[#6666ff] text-[#0a0f1e] text-[9px] font-black hover:bg-[#5252e0] cursor-pointer"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-start justify-between gap-3 select-none">
                                                <div className="text-[10px] font-black text-white leading-tight truncate max-w-[70%]">{note.title}</div>

                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button
                                                        onClick={() => startEditing(note)}
                                                        className="p-1 rounded bg-white/5 text-white/30 hover:text-[#6666ff] hover:bg-[#6666ff]/10 cursor-pointer flex-shrink-0"
                                                        title="Edit Note"
                                                    >
                                                        <PenTool size={9} />
                                                    </button>
                                                    <button
                                                        onClick={() => onDeleteNote && onDeleteNote(note.id)}
                                                        className="p-1 rounded bg-white/5 text-white/30 hover:text-red-400 hover:bg-red-500/10 cursor-pointer flex-shrink-0"
                                                        title="Delete Note"
                                                    >
                                                        <Trash2 size={9} />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-white/60 leading-normal font-medium">{note.content}</p>
                                            <div className="text-[8px] text-white/30 font-bold select-none mt-0.5">{note.date} • {note.source}</div>
                                        </>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </motion.section>
    )
}