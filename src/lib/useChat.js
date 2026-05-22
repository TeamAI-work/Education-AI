import supabase from './supabaseClient';

export default function useChat() {

    const fetchChats = async (userId) => {
        const { data, error } = await supabase.from('chat_sessions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    }

    const fetchChatMessages = async (chatId) => {
        const { data, error } = await supabase.from('chat_messages').select('*').eq('session_id', chatId);
        if (error) throw error;
        return data;
    }

    const appendMessage = async (chatId, message) => {
        const { data, error } = await supabase.from('chat_messages').insert({
            session_id: chatId,
            content: message
        });
        if (error) throw error;
        return data;
    }

    const deleteChat = async (chatId) => {
        const { data, error } = await supabase.from('chat_sessions').delete().eq('id', chatId);
        if (error) throw error;
        return data;
    }

    return {
        createChat,
        fetchChats,
        fetchChatMessages,
        appendMessage,
        deleteChat
    }
}