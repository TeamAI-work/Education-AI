import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useMemo, useState } from 'react';

export default function Settings({ isModel, onClose }) {
    const options = [
        { label: 'Profile', value: 'profile' },
        { label: 'Manage Chats', value: 'chats' },
        { label: 'Models', value: 'models' },
        { label: "Database", value: 'database' },
        { label: "Payments", value: 'payments' },
        { label: 'Help & Support', value: 'support' },
    ]

    {/* States*/ }
    const [activeOption, setActiveOption] = useState('Profile');

    const profile = useMemo(() => {
        try {
            const storedProfile = localStorage.getItem('edu_ai_profile');
            return storedProfile ? JSON.parse(storedProfile) : null;
        } catch (error) {
            console.warn('Unable to parse stored profile:', error);
            return null;
        }
    }, []);

    const isAvatarImage = (avatar) => {
        return typeof avatar === 'string' && /^(https?:\/\/|data:image\/|\/)/.test(avatar);
    };

    {/* Sections */ }

    const Profile = () => {
        const avatar = profile?.avatar_url || '\u{1F9D2}';

        return (
            <div>
                <div className="flex items-center gap-4 mb-6 justify-center border">
                    <div className="w-24 h-24 rounded-full flex items-center justify-center p-3 bg-white/5 border border-white/10">
                        <span className="text-5xl leading-none">{avatar}</span>
                    </div>
                </div>
            </div>
        )
    }
    return (
        // isModel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md g-opacity-50 flex items-center justify-center z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="p-4"
            >
                <div className="w-[60vw] h-[calc(100vh-4rem)] bg-[#0a0f1e] rounded-2xl border border-white/10 p-4 relative">

                    {/* Header */}
                    <div className="mb-4 border-b border-white/10 pb-3 flex items-center justify-between relative">
                        <span className="text-white font-bold text-lg">
                            Settings
                        </span>
                        <button onClick={onClose} className=" text-white/50 hover:text-white hover:bg-white/10 p-1 rounded-lg transition-colors">
                            <X size={22} />
                        </button>
                    </div>

                    <div className="flex gap-6 h-full">
                        {/*side Bar*/}
                        <div className="w-48 h-full flex-col flex">
                            {options.map((option) => (
                                <div
                                    onClick={() => setActiveOption(option.label)}
                                    key={option.label} className={`p-2 rounded-lg ${activeOption === option.label ? 'bg-white/10' : ''}  border border-white/10 mb-2 cursor-pointer hover:bg-white/10`}>
                                    {option.label}
                                </div>
                            ))}
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1">
                            {activeOption === 'Profile' && <Profile />}
                        </div>
                    </div>

                </div>
            </motion.div>
        </div>
        // )

    )
}
