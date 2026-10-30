import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatMessage {
    id: string;
    from: 'bot' | 'user';
    text: string;
}

interface OnboardingData {
    interests: string[];
    education: string;
    skillLevel: string;
    goals: string;
    preferredContent: string[];
}

// ─── Step Definitions ─────────────────────────────────────────────────────────
const INTEREST_OPTIONS = [
    'Data Structures', 'Algorithms', 'Machine Learning', 'Deep Learning',
    'Web Development', 'Mobile Development', 'Calculus', 'Statistics',
    'Operating Systems', 'Computer Networks', 'Database Systems', 'Physics',
    'Chemistry', 'Mathematics', 'Economics', 'Biology'
];

const EDUCATION_OPTIONS = ['High School', 'Undergraduate', 'Postgraduate', 'PhD', 'Other'];
const SKILL_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];
const GOAL_OPTIONS = ['Exam Prep', 'Learning New Skills', 'Research', 'Teaching / Sharing', 'Just Exploring'];
const CONTENT_OPTIONS = ['Lecture Notes', 'Study Guides', 'Past Exams', 'Academic Papers', 'Video Lectures', 'Flashcards'];

const STEPS = [
    {
        key: 'interests' as const,
        type: 'multiselect' as const,
        options: INTEREST_OPTIONS,
        getMessage: (name: string) =>
            `Hi ${name}! 👋 Welcome to Student Notes Hub. What subjects or topics are you most interested in? (Pick as many as you like)`
    },
    {
        key: 'education' as const,
        type: 'singleselect' as const,
        options: EDUCATION_OPTIONS,
        getMessage: () => 'Great choices! 📚 What is your current education level?'
    },
    {
        key: 'skillLevel' as const,
        type: 'singleselect' as const,
        options: SKILL_OPTIONS,
        getMessage: () => 'Awesome! How would you rate your skill level in your main subject?'
    },
    {
        key: 'goals' as const,
        type: 'singleselect' as const,
        options: GOAL_OPTIONS,
        getMessage: () => "What's your main goal here? 🎯"
    },
    {
        key: 'preferredContent' as const,
        type: 'multiselect' as const,
        options: CONTENT_OPTIONS,
        getMessage: () => 'Almost done! What type of content do you prefer? 📖'
    }
];

// ─── Component ─────────────────────────────────────────────────────────────────
const OnboardingChatbot = () => {
    const { user, completeOnboarding, dismissOnboarding } = useAuthStore();
    const [step, setStep] = useState(0);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isDone, setIsDone] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [data, setData] = useState<OnboardingData>({
        interests: [],
        education: '',
        skillLevel: '',
        goals: '',
        preferredContent: []
    });
    const [selection, setSelection] = useState<string[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const botMessageId = useRef(0);

    const addBotMessage = (text: string) => {
        const id = `bot-${++botMessageId.current}`;
        setMessages(prev => [...prev, { id, from: 'bot', text }]);
    };

    const addUserMessage = (text: string) => {
        const id = `usr-${Date.now()}`;
        setMessages(prev => [...prev, { id, from: 'user', text }]);
    };

    // Start first message on mount
    useEffect(() => {
        setIsTyping(true);
        const t = setTimeout(() => {
            setIsTyping(false);
            addBotMessage(STEPS[0].getMessage(user?.name.split(' ')[0] || 'there'));
        }, 900);
        return () => clearTimeout(t);
    }, []);

    // Scroll to bottom on new messages
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, isTyping]);

    const currentStep = STEPS[step];
    const isMulti = currentStep?.type === 'multiselect';
    const progress = Math.round(((step) / STEPS.length) * 100);

    const toggleChip = (option: string) => {
        if (isMulti) {
            setSelection(prev =>
                prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
            );
        } else {
            setSelection([option]);
        }
    };

    const handleNext = () => {
        if (isSubmitting) return;

        const value = isMulti ? selection : selection[0];
        if (!value || (Array.isArray(value) && value.length === 0)) return;

        // Record the answer
        const newData = { ...data };
        if (currentStep.key === 'interests' || currentStep.key === 'preferredContent') {
            (newData as any)[currentStep.key] = selection;
        } else {
            (newData as any)[currentStep.key] = selection[0];
        }
        setData(newData);

        // Show user bubble
        addUserMessage(Array.isArray(value) ? value.join(', ') : value);
        setSelection([]);

        const nextStep = step + 1;

        if (nextStep >= STEPS.length) {
            // Final submission
            setIsTyping(true);
            setTimeout(async () => {
                setIsTyping(false);
                addBotMessage(`You're all set, ${user?.name.split(' ')[0] || 'there'}! 🎉 Your feed is being personalized based on your interests. Enjoy exploring!`);
                setIsDone(true);
                setIsSubmitting(true);
                await completeOnboarding(newData);
            }, 900);
        } else {
            // Next step message
            setStep(nextStep);
            setIsTyping(true);
            setTimeout(() => {
                setIsTyping(false);
                addBotMessage(STEPS[nextStep].getMessage(user?.name.split(' ')[0] || 'there'));
            }, 900);
        }
    };

    const handleSkip = async () => {
        await dismissOnboarding();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
            <div className="relative w-full max-w-lg flex flex-col rounded-2xl overflow-hidden shadow-2xl" style={{ height: '90vh', maxHeight: '680px', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>

                {/* Header */}
                <div className="flex-shrink-0 px-6 pt-6 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            {/* Bot Avatar */}
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                🤖
                            </div>
                            <div>
                                <p className="font-semibold text-white text-sm">Study Hub Assistant</p>
                                <p className="text-xs" style={{ color: '#6ee7b7' }}>● Online</p>
                            </div>
                        </div>
                        {!isDone && (
                            <button
                                onClick={handleSkip}
                                className="text-xs px-3 py-1 rounded-full transition-all"
                                style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}
                                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
                            >
                                Skip for now
                            </button>
                        )}
                    </div>
                    {/* Progress bar */}
                    {!isDone && (
                        <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(255,255,255,0.1)' }}>
                            <div
                                className="h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
                            />
                        </div>
                    )}
                    {!isDone && (
                        <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                            Step {step + 1} of {STEPS.length}
                        </p>
                    )}
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.from === 'bot' ? 'justify-start' : 'justify-end'}`}>
                            {msg.from === 'bot' && (
                                <div className="w-7 h-7 rounded-full flex-shrink-0 mr-2 mt-1 flex items-center justify-center text-sm" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                    🤖
                                </div>
                            )}
                            <div
                                className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed max-w-xs"
                                style={msg.from === 'bot'
                                    ? { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.9)', borderRadius: '4px 18px 18px 18px' }
                                    : { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: '18px 18px 4px 18px' }
                                }
                            >
                                {msg.text}
                            </div>
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {isTyping && (
                        <div className="flex justify-start items-end gap-2">
                            <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                🤖
                            </div>
                            <div className="flex gap-1 px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '4px 18px 18px 18px' }}>
                                <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.5)', animation: 'bounce 1.2s infinite 0s' }} />
                                <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.5)', animation: 'bounce 1.2s infinite 0.2s' }} />
                                <span className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.5)', animation: 'bounce 1.2s infinite 0.4s' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                {!isDone && !isTyping && (
                    <div className="flex-shrink-0 px-5 pt-3 pb-5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        {/* Chips */}
                        <div className="flex flex-wrap gap-2 mb-4 max-h-36 overflow-y-auto pr-1">
                            {currentStep?.options.map(option => {
                                const selected = selection.includes(option);
                                return (
                                    <button
                                        key={option}
                                        onClick={() => toggleChip(option)}
                                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
                                        style={selected
                                            ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', transform: 'scale(1.05)', boxShadow: '0 0 10px rgba(139,92,246,0.5)' }
                                            : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' }
                                        }
                                    >
                                        {option}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Send Button */}
                        <button
                            onClick={handleNext}
                            disabled={selection.length === 0}
                            className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200"
                            style={{
                                background: selection.length > 0
                                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                                    : 'rgba(255,255,255,0.06)',
                                color: selection.length > 0 ? '#fff' : 'rgba(255,255,255,0.3)',
                                cursor: selection.length > 0 ? 'pointer' : 'not-allowed',
                                boxShadow: selection.length > 0 ? '0 4px 20px rgba(99,102,241,0.4)' : 'none'
                            }}
                        >
                            {step === STEPS.length - 1 ? '🚀 Finish Setup' : 'Continue →'}
                        </button>

                        {isMulti && (
                            <p className="text-center text-xs mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                Select one or more options
                            </p>
                        )}
                    </div>
                )}

                {/* Done state — close button */}
                {isDone && !isSubmitting && (
                    <div className="flex-shrink-0 px-5 pb-5">
                        <button
                            onClick={() => useAuthStore.getState().retriggerOnboarding()}
                            className="w-full py-3 rounded-xl font-semibold text-sm"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}
                        >
                            Let's Go! 🎉
                        </button>
                    </div>
                )}
            </div>

            {/* Bounce keyframes injected inline */}
            <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
        </div>
    );
};

export default OnboardingChatbot;
