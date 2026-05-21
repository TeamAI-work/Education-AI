import { logActivity, updateStreak, checkForNewBadges } from '../../../lib/gamification';
import { supabase } from '../../../lib/supabaseClient';
import { triggerBadgeCelebration } from '../../Navigation/UnlockOverlay';


export const panelTransition = { type: 'spring', stiffness: 240, damping: 28 };

export const RAG_DATABASE = {
  photosynthesis: {
    answer: "Photosynthesis is the amazing chemical reaction plants use to manufacture their food! By absorbing carbon dioxide from the air and water from the soil, plants use solar energy captured by chlorophyll (the pigment making leaves green) to synthesize glucose (sugars they consume) and release clean oxygen. The balanced chemical formula is: 6CO\u2082 + 6H\u2082O + Light energy \u2192 C\u2086H\u2081\u2082O\u2086 + 6O\u2082.",
    sources: ['Science Textbook, Ch. 3 - Plant Physiology', 'National Botany Society Journals'],
    title: 'Photosynthesis & Solar Energy'
  },
  space: {
    answer: 'Our Solar System resides inside the Milky Way and formed about 4.6 billion years ago! It is centered around the Sun (a yellow dwarf star) and includes eight major planets. The four inner worlds (Mercury, Venus, Earth, Mars) are dense, rocky planets, while the outer four (Jupiter, Saturn, Uranus, Neptune) are massive gas or ice giants. Mars holds the record for hosting Olympus Mons, the largest volcano in the solar system!',
    sources: ['NASA Space Academy archives', 'Astronomy Weekly, Issue 14'],
    title: 'Solar System Secrets'
  },
  rome: {
    answer: 'Ancient Rome began as a modest settlement on the Italian Peninsula in the 8th century BC and flourished into a colossal empire spanning three continents! Romans introduced lasting architectures (concrete, arches, and aqueducts) and built the Colosseum in 80 AD. Their legacy strongly shapes modern legal structures, languages (Latin roots), government representation, and engineering.',
    sources: ['World History Handbook, Vol. 2', 'Roman Archaeology Reports'],
    title: 'Legacy of Ancient Rome'
  },
  fractions: {
    answer: 'Fractions represent parts of a whole! The top number (numerator) represents the selected parts, and the bottom number (denominator) represents the total equal parts. To add or subtract fractions, you must find a common denominator (often using the least common multiple). For multiplication, simply multiply the numerators straight across and the denominators straight across!',
    sources: ['Core Pre-Algebra Standards', 'Interactive Middle School Mathematics, Ch. 5'],
    title: 'Understanding Fractions'
  }
};

export function getUserId() {
  return localStorage.getItem('edu_ai_user_id');
}

export function mapNoteRow(row) {
  return {
    id: row.id,
    title: row.user_annotations || 'Untitled Highlight',
    content: row.highlighted_text,
    date: new Date(row.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
    source: 'Aura AI Highlight'
  };
}

export function parseCitations(citations) {
  try {
    if (!citations) return null;
    if (Array.isArray(citations)) return citations;
    if (typeof citations === 'string') return JSON.parse(citations);
  } catch (error) {
    return null;
  }

  return null;
}

export function mapMessageRow(message) {
  return {
    id: message.id,
    sender: message.sender === 'user' ? 'user' : 'bot',
    text: message.message_content,
    time: new Date(message.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
    sources: parseCitations(message.citations)
  };
}

export async function fetchUserNotes(userId) {
  const { data, error } = await supabase
    .from('notebook_notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(mapNoteRow);
}

export async function fetchLatestChatSession(userId) {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  return data[0];
}

export async function createChatSession(userId, title = 'New Chat') {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({ user_id: userId, title })
    .select()
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function fetchSessionMessages(sessionId) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error || !data || data.length === 0) {
    return [];
  }

  return data.map(mapMessageRow);
}

export async function updateNotebookNote({ currentNotes, newNotes, userId }) {
  if (!userId) return currentNotes;

  const editedNote = newNotes.find((note) => {
    const original = currentNotes.find((currentNote) => currentNote.id === note.id);
    return original && (original.title !== note.title || original.content !== note.content);
  });

  if (!editedNote) {
    return currentNotes;
  }

  const { error } = await supabase
    .from('notebook_notes')
    .update({
      user_annotations: editedNote.title,
      highlighted_text: editedNote.content
    })
    .eq('id', editedNote.id);

  if (!error) {
    // Log a note_edit activity for Editor Pro badge tracking
    logActivity(userId, 'note_edit').catch(() => {});
  }

  return error ? currentNotes : newNotes;
}

export async function captureNotebookSelection({ userId, selectedText }) {
  if (!userId || !selectedText) return null;

  const title = selectedText.substring(0, 24) + (selectedText.length > 24 ? '...' : '');

  const { data, error } = await supabase
    .from('notebook_notes')
    .insert({
      user_id: userId,
      highlighted_text: selectedText,
      user_annotations: title
    })
    .select();

  if (error || !data || !data[0]) {
    return null;
  }

  // Trigger badge checking with dynamic grade group
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('grade_group')
      .eq('id', userId)
      .single();
    
    const gradeGroup = profile?.grade_group || '5-8';
    
    checkForNewBadges(userId, gradeGroup).then(({ newlyUnlocked }) => {
      if (newlyUnlocked && newlyUnlocked.length > 0) {
        triggerBadgeCelebration(newlyUnlocked);
      }
    });
  } catch (badgeErr) {
    console.warn('Error checking badges in captureNotebookSelection:', badgeErr);
  }

  return mapNoteRow(data[0]);
}

export function findRagMatch(query) {
  const normalizedQuery = query.toLowerCase();

  if (normalizedQuery.includes('photo') || normalizedQuery.includes('plant') || normalizedQuery.includes('leaf') || normalizedQuery.includes('sunlight')) {
    return 'photosynthesis';
  }

  if (normalizedQuery.includes('space') || normalizedQuery.includes('planet') || normalizedQuery.includes('solar') || normalizedQuery.includes('star') || normalizedQuery.includes('mars')) {
    return 'space';
  }

  if (normalizedQuery.includes('rome') || normalizedQuery.includes('roman') || normalizedQuery.includes('colosseum') || normalizedQuery.includes('empire')) {
    return 'rome';
  }

  if (normalizedQuery.includes('fraction') || normalizedQuery.includes('math') || normalizedQuery.includes('numerator') || normalizedQuery.includes('denominator')) {
    return 'fractions';
  }

  return null;
}

export function buildBotResponse(userText) {
  const matchedKey = findRagMatch(userText);
  const time = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  if (matchedKey) {
    const data = RAG_DATABASE[matchedKey];
    return {
      activeSources: data.sources,
      response: {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: `**${data.title}**\n\n${data.answer}`,
        sources: data.sources,
        time
      }
    };
  }

  return {
    activeSources: null,
    response: {
      id: `bot_${Date.now()}`,
      sender: 'bot',
      text: `I couldn't find a direct RAG textbook match for "${userText}". Here is my general study advice: break your study topic down into smaller questions, query textbook chapters, and highlight key definitions to store in your Digital Notebook. Try searching for **Photosynthesis**, **Space**, **Ancient Rome**, or **Fractions** to test the source-retrieval engine!`,
      time
    }
  };
}

export async function saveUserMessage({ sessionId, userText }) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      sender: 'user',
      message_content: userText
    })
    .select()
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function saveBotMessage({ sessionId, botResponse }) {
  const citationsArray = Array.isArray(botResponse.sources) ? botResponse.sources : [];

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      sender: 'ai',
      message_content: botResponse.text,
      citations: citationsArray
    })
    .select()
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function deleteNotebookNote(noteId) {
  const { error } = await supabase
    .from('notebook_notes')
    .delete()
    .eq('id', noteId);

  return !error;
}

export async function sendStudyMessage({
  currentSessionId,
  inputText,
  setActivitiesCount,
  setCurrentSessionId,
  setMessages,
  setActiveSources,
  setInputText,
  setIsTyping
}) {
  const userText = inputText.trim();
  if (!userText) return;

  const timestamp = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const userId = getUserId();

  if (userId) {
    const matchedSubject = findRagMatch(userText);
    await logActivity(userId, 'rag_query', null, matchedSubject ? { subject: matchedSubject } : null);
    
    setActivitiesCount((prev) => prev + 1);

    // Trigger badge checking with dynamic grade group
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('grade_group')
        .eq('id', userId)
        .single();
      
      const gradeGroup = profile?.grade_group || '5-8';
      
      checkForNewBadges(userId, gradeGroup).then(({ newlyUnlocked }) => {
        if (newlyUnlocked && newlyUnlocked.length > 0) {
          triggerBadgeCelebration(newlyUnlocked);
        }
      });
    } catch (badgeErr) {
      console.warn('Error checking badges in sendStudyMessage:', badgeErr);
    }
  }

  let sessionId = currentSessionId;
  if (!sessionId && userId) {
    const newSession = await createChatSession(userId, userText.substring(0, 30));
    if (newSession) {
      sessionId = newSession.id;
      setCurrentSessionId(sessionId);
    }
  }

  const fallbackUserMessage = {
    id: `user_${Date.now()}`,
    sender: 'user',
    text: userText,
    time: timestamp
  };

  if (sessionId) {
    const savedUserMessage = await saveUserMessage({ sessionId, userText });
    setMessages((prev) => [
      ...prev,
      savedUserMessage
        ? {
            id: savedUserMessage.id,
            sender: 'user',
            text: userText,
            time: timestamp
          }
        : fallbackUserMessage
    ]);
  } else {
    setMessages((prev) => [...prev, fallbackUserMessage]);
  }

  setInputText('');
  setIsTyping(true);
  setActiveSources(null);

  setTimeout(async () => {
    const { response, activeSources } = buildBotResponse(userText);

    if (activeSources) {
      setActiveSources(activeSources);
    }

    if (sessionId) {
      const savedBotMessage = await saveBotMessage({ sessionId, botResponse: response });
      if (savedBotMessage) {
        response.id = savedBotMessage.id;
      }
    }

    setMessages((prev) => [...prev, response]);
    setIsTyping(false);
  }, 1200);
}
