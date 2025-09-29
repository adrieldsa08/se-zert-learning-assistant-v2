import React, { useState, useRef, useEffect, useCallback, useContext } from 'react';
import { getSearchResponse, generateFlashcards, generateSummary, generatePodcast, getCertificate } from './services/geminiService';
<<<<<<< HEAD
import type { Message, ProgressData, Flashcard, DocContextType } from './types';
=======
import type { GeminiToolResponse } from './services/geminiService';
import { generateCertificateImage } from './services/certificateGenerator';
import type { Message, ProgressData, Flashcard, DocContextType, WebSource } from './types';
>>>>>>> 85593d0 (Initial commit - AI Studio export)
import { Role } from './types';
import { DocContext } from './contexts/DocContext';

// --- ICONS ---
const SeZertLogo = (props: React.SVGProps<SVGSVGElement>) => ( <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}> <path d="M4 14V17C4 18.1046 4.89543 19 6 19H7" stroke="currentColor" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/> <path d="M17 19H18C19.1046 19 20 18.1046 20 17V14" stroke="currentColor" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/> <path d="M15 11.6461C14.1812 11.2323 13.1384 11 12 11C10.8616 11 9.81881 11.2323 9 11.6461" stroke="currentColor" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round"/> <path d="M17 16V19C17 19.5523 16.5523 20 16 20H15" stroke="currentColor" strokeOpacity="0.6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/> <rect x="7" y="12" width="10" height="7" rx="1.5" fill="currentColor" fillOpacity="0.3"/> <rect x="2" y="12" width="5" height="4" rx="1" fill="currentColor" fillOpacity="0.3"/> <rect x="17" y="12" width="5" height="4" rx="1" fill="currentColor" fillOpacity="0.3"/> <circle cx="10.5" cy="15.5" r="1" fill="currentColor" /> <circle cx="13.5" cy="15.5" r="1" fill="currentColor" /> </svg> );
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /> </svg> );
const FlashcardIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 21h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5z" /> <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 4.5v16.5" /> </svg> );
const SummaryIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /> </svg> );
const PodcastIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /> </svg> );
const SendIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /> </svg> );
const ChartBarIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> </svg> );
const HomeIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> </svg>);
const ClipboardListIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> </svg> );
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> </svg> );
const AcademicCapIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.906 59.906 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0l-.07.002a51.286 51.286 0 00-2.215 8.254M12 10.75v6.578l5.75-3.29zM12 3.493l-5.75 3.29m11.5 0l-5.75-3.29" /> </svg> );
const LoadingSpinner = () => <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>;
const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" {...props}> <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /> </svg>);
const UploadIcon = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></svg>);
const PaperclipIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.122 2.122l7.81-7.81" /> </svg> );


// --- DATA & CONFIG ---
const TOTAL_CHAPTERS_FOR_CERTIFICATION = 5;
const initialProgress: ProgressData = { flashcardsTried: 0, flashcardDecksCreated: 0, flashcardRatings: { easy: 0, medium: 0, hard: 0 }, podcastSessions: 0, summariesAccessed: 0, };
type Tool = 'search' | 'flashcards' | 'summary' | 'podcast' | 'certificate';
const tools: { id: Tool; name: string; icon: React.ReactNode }[] = [ 
    { id: 'search', name: 'Search', icon: <SearchIcon className="w-8 h-8" /> }, 
    { id: 'flashcards', name: 'Flashcards', icon: <FlashcardIcon className="w-8 h-8" /> }, 
    { id: 'summary', name: 'Summaries', icon: <SummaryIcon className="w-8 h-8" /> }, 
    { id: 'podcast', name: 'Podcast It!', icon: <PodcastIcon className="w-8 h-8" /> }, 
    { id: 'certificate', name: 'Certificate', icon: <AcademicCapIcon className="w-8 h-8" /> }, 
];


// --- UI COMPONENTS ---
<<<<<<< HEAD
=======
const WebSourceList: React.FC<{ sources: WebSource[] }> = ({ sources }) => {
    if (!sources || sources.length === 0) return null;
    return (
        <div className="mt-2 pt-2 border-t border-slate-300 dark:border-slate-600">
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Sources</h4>
            <ul className="list-disc list-inside space-y-1">
                {sources.map((source, index) => (
                    <li key={index} className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" title={source.title}>
                           {source.title}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};
>>>>>>> 85593d0 (Initial commit - AI Studio export)
const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
    const isAssistant = message.role === Role.ASSISTANT;
    const bubbleClasses = isAssistant ? 'bg-assistant-bubble-light dark:bg-assistant-bubble-dark self-start rounded-r-xl rounded-bl-xl' : 'bg-user-bubble text-white self-end rounded-l-xl rounded-br-xl';
    const LoadingDots = () => ( <div className="flex space-x-1 p-2"> <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div> <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div> <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div> </div> );
    return (
        <div className={`flex w-full ${isAssistant ? 'justify-start' : 'justify-end'}`}>
<<<<<<< HEAD
            <div className={`max-w-xl lg:max-w-2xl px-5 py-3 text-light-text dark:text-dark-text shadow-md ${bubbleClasses} transition-colors duration-300 whitespace-pre-wrap`}>
                {message.isLoading ? <LoadingDots /> : message.content}
                {message.source && !message.isLoading && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-300 dark:border-slate-600">Source: {message.source}</p>}
=======
            <div className={`max-w-xl lg:max-w-2xl px-5 py-3 text-light-text dark:text-dark-text shadow-md ${bubbleClasses} transition-colors duration-300`}>
                {message.pageConstraint && !message.isLoading && (
                    <div className="mb-2 text-xs font-semibold text-primary dark:text-primary-dark bg-primary/10 dark:bg-primary/20 px-2 py-1 rounded-full inline-block">
                        Filtered to {message.pageConstraint}
                    </div>
                )}
                <div className="whitespace-pre-wrap">
                    {message.isLoading ? <LoadingDots /> : message.content}
                </div>
                {message.pdfSource && !message.isLoading && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-300 dark:border-slate-600">Source: {message.pdfSource}</p>}
                {message.webSources && !message.isLoading && <WebSourceList sources={message.webSources} />}
                {message.webSources?.length === 0 && !message.isLoading && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-300 dark:border-slate-600">Source: Model’s general knowledge (no external attribution returned).</p>}
>>>>>>> 85593d0 (Initial commit - AI Studio export)
            </div>
        </div>
    );
};
const StatCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-light-card dark:bg-dark-card p-6 rounded-xl shadow-lg flex flex-col items-center text-center transition-all hover:shadow-xl hover:scale-105">
        <div className="text-primary mb-3">{icon}</div>
        <h3 className="text-lg font-bold text-light-text dark:text-dark-text mb-2">{title}</h3>
        <div className="text-secondary dark:text-slate-400">{children}</div>
    </div>
);
const Dashboard: React.FC<{ progress: ProgressData, onStartLearning: () => void, onViewCertificate: () => void }> = ({ progress, onStartLearning, onViewCertificate }) => {
    const { flashcardsTried, flashcardRatings, podcastSessions, summariesAccessed, flashcardDecksCreated } = progress;
    const topicsReviewed = podcastSessions + summariesAccessed + flashcardDecksCreated;
    const totalActivity = topicsReviewed + flashcardsTried;

    if (totalActivity === 0) {
        return ( <div className="text-center p-8"> <h2 className="text-2xl font-bold mb-4">Welcome, Max!</h2> <p className="text-secondary dark:text-slate-400 mb-6">You haven’t started a session yet. Select a learning tool or upload a PDF to begin your journey.</p> <button onClick={onStartLearning} className="px-6 py-3 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-primary-dark transition-colors">Start Learning</button> </div> );
    }
    return (
        <div className="p-4 sm:p-6 animate-fade-in">
            <h2 className="text-3xl font-bold mb-6 text-center">📊 Here’s your Learning Progress, Max!</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard icon={<ClipboardListIcon className="w-10 h-10"/>} title="Topics Reviewed"> <p className="text-3xl font-bold text-primary">{topicsReviewed}</p> <p>{summariesAccessed} Summaries, {podcastSessions} Podcasts, {flashcardDecksCreated} Flashcard Decks</p> </StatCard>
                <StatCard icon={<FlashcardIcon className="h-10 w-10 text-primary"/>} title="Flashcards Tried"> <p className="text-3xl font-bold text-primary">{flashcardsTried}</p> <div className="flex justify-center space-x-2 text-xs"> <span className="text-green-500">● {flashcardRatings.easy} Easy</span> <span className="text-yellow-500">● {flashcardRatings.medium} Medium</span> <span className="text-red-500">● {flashcardRatings.hard} Hard</span> </div> </StatCard>
                 <StatCard icon={<AcademicCapIcon className="w-10 h-10"/>} title="Certification"> {topicsReviewed >= TOTAL_CHAPTERS_FOR_CERTIFICATION ? ( <div className="flex flex-col items-center justify-center space-y-2"> <div className="flex items-center justify-center space-x-2 text-green-500"> <CheckCircleIcon className="w-8 h-8"/> <span className="text-xl font-bold">Completed!</span> </div> <button onClick={onViewCertificate} className="mt-2 px-4 py-1 bg-primary text-white text-sm font-bold rounded-lg shadow-md hover:bg-primary-dark transition-colors">View Certificate</button> </div> ) : ( <p className="text-3xl font-bold text-primary">{topicsReviewed} <span className="text-base font-normal text-secondary dark:text-slate-400">/ {TOTAL_CHAPTERS_FOR_CERTIFICATION}</span></p> )} </StatCard>
            </div>
            <div className="text-center"> <p className="text-lg font-semibold">You're doing great! Ready to continue?</p> <button onClick={onStartLearning} className="mt-4 px-6 py-3 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-primary-dark transition-colors">Continue Learning</button> </div>
        </div>
    );
};
const NavButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; className?: string }> = ({ active, onClick, children, className }) => ( <button onClick={onClick} className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${ active ? 'bg-primary text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700' } ${className}`} > {children} </button> );
const ToolInputForm: React.FC<{ onSubmit: (topic: string) => void; isLoading: boolean; placeholder: string; cta: string; }> = ({ onSubmit, isLoading, placeholder, cta }) => {
    const [topic, setTopic] = useState('');
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit(topic); };
    return ( <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3 p-1"> <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={placeholder} className="flex-1 w-full p-3 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-light-card dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition" disabled={isLoading} aria-label="Topic input" /> <button type="submit" className="w-full sm:w-auto px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors shadow-lg" disabled={!topic.trim() || isLoading} aria-label={cta}> {isLoading ? 'Generating...' : cta} </button> </form> );
};
<<<<<<< HEAD
const ResponseDisplay: React.FC<{ content: string; error?: string | null; source?: string | null }> = ({ content, error, source }) => {
    if (error) return <div className="mt-4 p-4 text-red-700 bg-red-100 dark:bg-red-900/50 dark:text-red-300 rounded-lg">{error}</div>;
    if (!content) return null;
    return <div className="mt-4 p-4 bg-assistant-bubble-light dark:bg-assistant-bubble-dark rounded-lg whitespace-pre-wrap">{content}{source && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-300 dark:border-slate-600">Source: {source}</p>}</div>;
=======
const ResponseDisplay: React.FC<{ content: string; error?: string | null; source?: string | null; webSources?: WebSource[] | null; pageConstraint?: string | null;}> = ({ content, error, source, webSources, pageConstraint }) => {
    if (error) return <div className="mt-4 p-4 text-red-700 bg-red-100 dark:bg-red-900/50 dark:text-red-300 rounded-lg">{error}</div>;
    if (!content) return null;
    return (
        <div className="mt-4 p-4 bg-assistant-bubble-light dark:bg-assistant-bubble-dark rounded-lg">
             {pageConstraint && (
                <div className="mb-2 text-xs font-semibold text-primary dark:text-primary-dark bg-primary/10 dark:bg-primary/20 px-2 py-1 rounded-full inline-block">
                    Filtered to {pageConstraint}
                </div>
            )}
            <div className="whitespace-pre-wrap">
                {content}
            </div>
            {source && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-300 dark:border-slate-600">Source: {source}</p>}
            {webSources && <WebSourceList sources={webSources} />}
            {webSources?.length === 0 && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-300 dark:border-slate-600">Source: Model’s general knowledge (no external attribution returned).</p>}
        </div>
    );
>>>>>>> 85593d0 (Initial commit - AI Studio export)
};
const UploadControl: React.FC = () => {
    const docContext = useContext(DocContext);
    const fileInputRef = useRef<HTMLInputElement>(null);
    if (!docContext) return null;
    const { fileName, isProcessing, setDoc, clearDoc } = docContext;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setDoc(file);
        }
    };

    return (
        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg shadow-inner">
            <input type="file" accept="application/pdf" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
            {isProcessing ? ( <div className="flex items-center justify-center text-secondary dark:text-slate-400"> <LoadingSpinner /> <span className="ml-2">Processing PDF...</span> </div> ) : fileName ? (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-secondary dark:text-slate-300 truncate"> <span className="font-bold">Using:</span> {fileName} </p>
                    <button onClick={clearDoc} className="text-xs text-red-500 hover:text-red-700 font-semibold ml-4">Clear</button>
                </div>
            ) : (
                <div className="text-center">
                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-primary-dark transition-colors w-full"> Select PDF to analyze </button>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Your PDF is processed locally in your browser.</p>
                </div>
            )}
        </div>
    );
};


// --- TOOL COMPONENTS ---
const SearchTool: React.FC<{ docContext: DocContextType }> = ({ docContext }) => {
    const { chunks, fileName } = docContext;
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [attachedImages, setAttachedImages] = useState<{ file: File, dataUrl: string }[]>([]);
    const [imageError, setImageError] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const isLoading = messages[messages.length - 1]?.isLoading ?? false;

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
    
    // Cleanup object URLs on unmount or when images change
    useEffect(() => {
        return () => {
            attachedImages.forEach(img => URL.revokeObjectURL(img.dataUrl));
        };
    }, [attachedImages]);

    const fileToBase64 = (file: File): Promise<{ data: string; mime: string }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const dataUrl = reader.result as string;
                const base64Data = dataUrl.split(',')[1];
                if (!base64Data) {
                    reject(new Error("Failed to parse base64 data from file."));
                    return;
                }
                resolve({ data: base64Data, mime: file.type });
            };
            reader.onerror = error => reject(error);
        });
    };

    const handleImageAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
        setImageError(null);
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        if (attachedImages.length + files.length > 3) {
            setImageError("You can attach a maximum of 3 images.");
            e.target.value = '';
            return;
        }

        const newImages: { file: File, dataUrl: string }[] = [];
        for (const file of files) {
            if (file.size > 5 * 1024 * 1024) { // 5MB
                setImageError(`File "${file.name}" is too large (max 5MB).`);
                continue;
            }
            if (!['image/png', 'image/jpeg'].includes(file.type)) {
                setImageError(`File "${file.name}" has an unsupported type. Please use PNG or JPG.`);
                continue;
            }
            newImages.push({ file, dataUrl: URL.createObjectURL(file) });
        }
        setAttachedImages(prev => [...prev, ...newImages]);
        e.target.value = '';
    };

    const handleRemoveImage = (indexToRemove: number) => {
        URL.revokeObjectURL(attachedImages[indexToRemove].dataUrl);
        setAttachedImages(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleClearImages = () => {
        attachedImages.forEach(img => URL.revokeObjectURL(img.dataUrl));
        setAttachedImages([]);
        setImageError(null);
    };

    const sendMessage = async (messageText: string) => {
        if (!messageText.trim() && attachedImages.length === 0) return;

        const userMessage: Message = { id: `user-${Date.now()}`, role: Role.USER, content: messageText };
        const loadingMessage: Message = { id: `assistant-loading-${Date.now()}`, role: Role.ASSISTANT, content: '...', isLoading: true };
        setMessages(prev => [...prev, userMessage, loadingMessage]);
        setInput('');
<<<<<<< HEAD
=======
        handleClearImages();
>>>>>>> 85593d0 (Initial commit - AI Studio export)

        try {
            const imagePayload = await Promise.all(
                attachedImages.map(img => fileToBase64(img.file).then(res => ({ mimeType: res.mime, data: res.data })))
            );
<<<<<<< HEAD
            const responseText = await getSearchResponse(messageText, chunks, imagePayload);
            const assistantMessage: Message = { id: `assistant-${Date.now()}`, role: Role.ASSISTANT, content: responseText, source: chunks ? fileName : null };
            setMessages(prev => [...prev.filter(msg => !msg.isLoading), assistantMessage]);
        } catch (error) {
            console.error("Error processing images or sending message:", error);
            const errorMessage: Message = { id: `assistant-error-${Date.now()}`, role: Role.ASSISTANT, content: "Sorry, there was an error processing your images. Please try again." };
=======
            const response = await getSearchResponse(messageText, chunks, imagePayload);
            
            const assistantMessage: Message = {
                id: `assistant-${Date.now()}`,
                role: Role.ASSISTANT,
                content: response.content,
                pdfSource: response.pdfSource ? fileName : null,
                webSources: response.webSources,
                pageConstraint: response.pageConstraint,
            };
            setMessages(prev => [...prev.filter(msg => !msg.isLoading), assistantMessage]);
        } catch (error) {
            console.error("Error processing images or sending message:", error);
            const errorMessage: Message = { id: `assistant-error-${Date.now()}`, role: Role.ASSISTANT, content: "Sorry, there was an error processing your request. Please try again." };
>>>>>>> 85593d0 (Initial commit - AI Studio export)
            setMessages(prev => [...prev.filter(msg => !msg.isLoading), errorMessage]);
        }
    };
    
<<<<<<< HEAD
    useEffect(() => { if(messages.length === 0) { setMessages([{id: 'welcome-search', role: Role.ASSISTANT, content: "Ask me anything about your Systems Engineering course material, or attach an image to discuss."}]) } }, [messages.length]);
=======
    useEffect(() => { if(messages.length === 0) { setMessages([{id: 'welcome-search', role: Role.ASSISTANT, content: "Ask me anything about Systems Engineering. If you upload a PDF, I'll answer based on its content. Otherwise, I'll use Google Search.\n\nTip: Try filtering by page, e.g., 'summarize risk management from page 10' or 'what is a stakeholder on pages 3-5?'"}]) } }, [messages.length]);
>>>>>>> 85593d0 (Initial commit - AI Studio export)
    
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendMessage(input); };

    return ( 
        <div className="flex flex-col h-full"> 
            <div className="flex-1 overflow-y-auto p-4 space-y-6"> 
                {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)} 
                <div ref={chatEndRef} /> 
            </div> 
            <div className="p-4 bg-light-card dark:bg-dark-card/80 backdrop-blur-sm sticky bottom-0 border-t border-slate-200 dark:border-slate-700">
                {attachedImages.length > 0 && (
                    <div className="mb-2 px-1">
                        <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-semibold text-light-text dark:text-dark-text">Attached Images:</span>
                            <button onClick={handleClearImages} className="text-xs text-red-500 hover:underline">Clear all</button>
                        </div>
                        <div className="flex gap-2 overflow-x-auto p-1 bg-light-bg dark:bg-dark-bg rounded-lg">
                            {attachedImages.map((img, index) => (
                                <div key={`${img.file.name}-${index}`} className="relative flex-shrink-0 h-16 w-16">
                                    <img src={img.dataUrl} alt={img.file.name} className="h-full w-full object-cover rounded-md shadow-sm"/>
                                    <button 
                                        onClick={() => handleRemoveImage(index)} 
                                        className="absolute -top-1 -right-1 bg-black/60 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs border-2 border-white"
                                        aria-label={`Remove ${img.file.name}`}
                                    >
                                       &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {imageError && <p className="text-red-500 text-xs mb-2 px-1">{imageError}</p>}
                
                <form onSubmit={handleSubmit} className="flex items-center space-x-3">
                     <button 
                        type="button" 
                        onClick={() => imageInputRef.current?.click()} 
                        className="p-3 text-secondary dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                        aria-label="Attach images"
                     >
                        <PaperclipIcon className="h-6 w-6" />
                    </button>
                    <input ref={imageInputRef} type="file" multiple accept="image/png,image/jpeg" className="hidden" onChange={handleImageAttach} />
                    
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about the course or attached images..." className="flex-1 p-3 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-light-card dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition" disabled={isLoading} aria-label="Search input" />
                    <button type="submit" className="relative p-3 bg-primary text-white rounded-full hover:bg-primary-dark disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors shadow-lg" disabled={(!input.trim() && attachedImages.length === 0) || isLoading} aria-label="Send message">
                         {attachedImages.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-light-card dark:border-dark-card">{attachedImages.length}</span>}
                        <SendIcon />
                    </button>
                </form>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">Images are analyzed locally and sent to the model for reasoning.</p>
            </div> 
        </div> 
    );
};
const FlashcardsTool: React.FC<{ setProgress: React.Dispatch<React.SetStateAction<ProgressData>>; docContext: DocContextType }> = ({ setProgress, docContext }) => {
    const { chunks, fileName } = docContext;
    const [deck, setDeck] = useState<Flashcard[]>([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isAnswerShown, setIsAnswerShown] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async (topic: string) => { setIsLoading(true); setError(null); setDeck([]); try { const newDeck = await generateFlashcards(topic, chunks); setDeck(newDeck); setCurrentCardIndex(0); setIsAnswerShown(false); setProgress(p => ({ ...p, flashcardDecksCreated: p.flashcardDecksCreated + 1 })); } catch (e: any) { setError(e.message); } finally { setIsLoading(false); } };
    const handleRating = (rating: 'easy' | 'medium' | 'hard') => { setProgress(prev => ({ ...prev, flashcardsTried: prev.flashcardsTried + 1, flashcardRatings: { ...prev.flashcardRatings, [rating]: prev.flashcardRatings[rating] + 1 } })); if (currentCardIndex < deck.length - 1) { setCurrentCardIndex(prev => prev + 1); setIsAnswerShown(false); } else { setDeck([]); } };

    if (deck.length > 0) {
        const card = deck[currentCardIndex];
        return ( <div className="p-4 sm:p-6 text-center animate-fade-in"> <p className="text-secondary dark:text-slate-400 mb-2">Card {currentCardIndex + 1} of {deck.length}</p> {fileName && <p className="text-xs text-slate-500 mb-4">(Source: {fileName})</p>} <div className="min-h-[250px] p-6 bg-light-card dark:bg-dark-card rounded-xl shadow-lg flex flex-col justify-center items-center transition-all"> <p className="text-lg font-semibold text-secondary dark:text-slate-400 mb-2">{isAnswerShown ? 'Answer' : 'Question'}</p> <p className="text-xl text-light-text dark:text-dark-text">{isAnswerShown ? card.answer : card.question}</p> </div> {isAnswerShown ? ( <div className="mt-6"> <p className="mb-3 font-semibold">How well did you know this?</p> <div className="flex justify-center items-center space-x-4"> <button onClick={() => handleRating('easy')} className="px-6 py-2 rounded-lg text-white font-bold transition-transform transform hover:scale-105 shadow-md bg-green-500 hover:bg-green-600">Easy</button> <button onClick={() => handleRating('medium')} className="px-6 py-2 rounded-lg text-white font-bold transition-transform transform hover:scale-105 shadow-md bg-yellow-500 hover:bg-yellow-600">Medium</button> <button onClick={() => handleRating('hard')} className="px-6 py-2 rounded-lg text-white font-bold transition-transform transform hover:scale-105 shadow-md bg-red-500 hover:bg-red-600">Hard</button> </div> </div> ) : ( <button onClick={() => setIsAnswerShown(true)} className="mt-6 px-8 py-3 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-primary-dark transition-colors">Show Answer</button> )} </div> );
    }
<<<<<<< HEAD
    return ( <div className="p-4 sm:p-6"> <ToolInputForm onSubmit={handleGenerate} isLoading={isLoading} placeholder="e.g., 'Lifecycle Models' or 'Chapter 3'" cta="Generate Flashcards" /> {error && <ResponseDisplay error={error} content="" />} {isLoading && <div className="flex justify-center mt-6"><LoadingSpinner /></div> } </div> );
};
const SummaryTool: React.FC<{ setProgress: React.Dispatch<React.SetStateAction<ProgressData>>; docContext: DocContextType }> = ({ setProgress, docContext }) => {
    const { chunks, fileName } = docContext;
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const handleGenerate = async (topic: string) => { setIsLoading(true); setError(null); setSummary(''); try { const result = await generateSummary(topic, chunks); setSummary(result); setProgress(p => ({...p, summariesAccessed: p.summariesAccessed + 1})); } catch (e: any) { setError(e.message); } finally { setIsLoading(false); } };
    return ( <div className="p-4 sm:p-6"> <ToolInputForm onSubmit={handleGenerate} isLoading={isLoading} placeholder="e.g., 'Requirements Engineering' or 'Chapter 4'" cta="Generate Summary" /> {isLoading ? <div className="flex justify-center mt-6"><LoadingSpinner /></div> : <ResponseDisplay content={summary} error={error} source={summary ? fileName : null} />} </div> );
=======
    return ( <div className="p-4 sm:p-6"> <ToolInputForm onSubmit={handleGenerate} isLoading={isLoading} placeholder="e.g., 'Lifecycle Models from page 10'" cta="Generate Flashcards" /> {error && <ResponseDisplay error={error} content="" />} {isLoading && <div className="flex justify-center mt-6"><LoadingSpinner /></div> } </div> );
};
const SummaryTool: React.FC<{ setProgress: React.Dispatch<React.SetStateAction<ProgressData>>; docContext: DocContextType }> = ({ setProgress, docContext }) => {
    const { chunks, fileName } = docContext;
    const [summaryResult, setSummaryResult] = useState<GeminiToolResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const handleGenerate = async (topic: string) => { setIsLoading(true); setError(null); setSummaryResult(null); try { const result = await generateSummary(topic, chunks); setSummaryResult(result); if(result.content) setProgress(p => ({...p, summariesAccessed: p.summariesAccessed + 1})); } catch (e: any) { setError(e.message); } finally { setIsLoading(false); } };
    return ( <div className="p-4 sm:p-6"> <ToolInputForm onSubmit={handleGenerate} isLoading={isLoading} placeholder="e.g., 'Requirements Engineering on pages 20-22'" cta="Generate Summary" /> {isLoading ? <div className="flex justify-center mt-6"><LoadingSpinner /></div> : <ResponseDisplay content={summaryResult?.content || ''} error={error} source={summaryResult?.pdfSource ? fileName : null} webSources={summaryResult?.webSources} pageConstraint={summaryResult?.pageConstraint} />} </div> );
>>>>>>> 85593d0 (Initial commit - AI Studio export)
};
const PodcastTool: React.FC<{ setProgress: React.Dispatch<React.SetStateAction<ProgressData>>; docContext: DocContextType }> = ({ setProgress, docContext }) => {
    const { chunks, fileName } = docContext;
    const [script, setScript] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoiceName, setSelectedVoiceName] = useState<string | null>(null);
    const [playbackState, setPlaybackState] = useState<'idle' | 'playing' | 'paused'>('idle');

    const sentenceQueueRef = useRef<string[]>([]);
    const currentSentenceIndexRef = useRef(0);
    
    const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

    const findBestAvailableVoice = useCallback((availableVoices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
        if (!availableVoices.length) return null;

        const preferredVoices = ["Google US English", "Google UK English Female", "Google UK English Male", "Samantha", "Karen", "Daniel", "Moira", "Tessa", "Alex"];
        
        for (const preferred of preferredVoices) {
            const found = availableVoices.find(v => v.name.toLowerCase().includes(preferred.toLowerCase()));
            if (found) return found;
        }

        const enUSVoice = availableVoices.find(v => v.lang === 'en-US' && !v.localService);
        if (enUSVoice) return enUSVoice;

        const anyEnglishVoice = availableVoices.find(v => v.lang.startsWith('en-'));
        if (anyEnglishVoice) return anyEnglishVoice;
        
        return availableVoices[0];
    }, []);

    useEffect(() => {
        if (!isSupported) return;
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length > 0) {
                setVoices(availableVoices);
                const savedVoiceName = localStorage.getItem('podcast.voiceName');
                const savedVoice = availableVoices.find(v => v.name === savedVoiceName);
                if (savedVoice) {
                    setSelectedVoiceName(savedVoice.name);
                } else {
                    const bestVoice = findBestAvailableVoice(availableVoices);
                    if (bestVoice) setSelectedVoiceName(bestVoice.name);
                }
            }
        };

        loadVoices();
        window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
        return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    }, [isSupported, findBestAvailableVoice]);

    const speakNextSentence = useCallback(() => {
        if (currentSentenceIndexRef.current >= sentenceQueueRef.current.length) {
            setPlaybackState('idle');
            return;
        }
        
        const text = sentenceQueueRef.current[currentSentenceIndexRef.current];
        const utterance = new SpeechSynthesisUtterance(text);
        const selectedVoice = voices.find(v => v.name === selectedVoiceName);

        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.lang = "en-US";
        utterance.rate = 0.95;
        utterance.pitch = 1.03;
        utterance.volume = 1;

        utterance.onend = () => {
            currentSentenceIndexRef.current += 1;
            setTimeout(() => speakNextSentence(), 140);
        };
        
        utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
            if (e.error === 'interrupted') return;
            console.error("Speech synthesis error:", e);
            setError(`Audio playback failed: ${e.error}`);
            setPlaybackState('idle');
        };

        window.speechSynthesis.speak(utterance);
    }, [voices, selectedVoiceName]);

    const handlePlay = useCallback(() => {
        if (!script) return;
        window.speechSynthesis.cancel();
        sentenceQueueRef.current = script.match(/[^.!?]+[.!?]+(\s|$)/g) || [script];
        currentSentenceIndexRef.current = 0;
        setPlaybackState('playing');
        speakNextSentence();
    }, [script, speakNextSentence]);

    const handlePause = useCallback(() => {
        window.speechSynthesis.pause();
        setPlaybackState('paused');
    }, []);

    const handleResume = useCallback(() => {
        window.speechSynthesis.resume();
        setPlaybackState('playing');
    }, []);
    
    const handleStop = useCallback(() => {
        window.speechSynthesis.cancel();
        setPlaybackState('idle');
    }, []);

    useEffect(() => {
      // Cleanup on unmount
      return () => {
        if (isSupported) window.speechSynthesis.cancel();
      };
    }, [isSupported]);
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (script && event.altKey) {
                event.preventDefault();
                switch (event.key.toLowerCase()) {
                    case 'p': if(playbackState === 'idle') handlePlay(); break;
                    case 'u': if(playbackState === 'playing') handlePause(); break;
                    case 'r': if(playbackState === 'paused') handleResume(); break;
                    case 's': if(playbackState !== 'idle') handleStop(); break;
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [script, playbackState, handlePlay, handlePause, handleResume, handleStop]);
    
    const handleGenerate = async (topic: string) => {
        handleStop();
        setIsLoading(true);
        setError(null);
        setScript('');
        try {
            const result = await generatePodcast(topic, chunks);
            setScript(result);
            setProgress(p => ({...p, podcastSessions: p.podcastSessions + 1}));
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const name = e.target.value;
      setSelectedVoiceName(name);
      localStorage.setItem('podcast.voiceName', name);
    };

    const testVoice = () => {
      if (!selectedVoiceName) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance("Hi, this is your podcast voice.");
      const voice = voices.find(v => v.name === selectedVoiceName);
      if (voice) utterance.voice = voice;
      window.speechSynthesis.speak(utterance);
    }

<<<<<<< HEAD
    return ( <div className="p-4 sm:p-6"> <ToolInputForm onSubmit={handleGenerate} isLoading={isLoading} placeholder="e.g., 'Verification and Validation'" cta="Generate Podcast Script" /> {isLoading ? <div className="flex justify-center mt-6"><LoadingSpinner /></div> : ( <> <ResponseDisplay content={script} error={error} source={script ? fileName : null} /> {script && !error && ( <div className="mt-4 flex justify-center flex-col items-center"> {!isSupported ? ( <p className="text-sm text-secondary dark:text-slate-400">Voice playback isn’t supported in this browser. Try Chrome/Edge/Safari.</p> ) : ( <> <div className="mb-4 w-full max-w-md flex items-center space-x-2"> <select value={selectedVoiceName || ''} onChange={handleVoiceChange} className="flex-1 p-2 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-light-card dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition" aria-label="Select voice"> {voices.map(voice => <option key={voice.name} value={voice.name}>{voice.name} ({voice.lang})</option>)} </select> <button onClick={testVoice} className="px-3 py-2 bg-slate-200 dark:bg-slate-600 text-light-text dark:text-dark-text font-bold rounded-lg shadow-md hover:bg-slate-300 dark:hover:bg-slate-500" aria-label="Test selected voice">Test voice</button> </div> <div className="flex flex-wrap items-center justify-center gap-2"> <button onClick={handlePlay} disabled={playbackState !== 'idle'} className="px-4 py-2 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-primary-dark disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors flex items-center" aria-label="Play (Alt+P)"> <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg> Play </button> <button onClick={handlePause} disabled={playbackState !== 'playing'} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-light-text dark:text-dark-text font-bold rounded-lg shadow-md hover:bg-slate-300 dark:hover:bg-slate-500 disabled:bg-slate-400 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors flex items-center" aria-label="Pause (Alt+U)"> <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg> Pause </button> <button onClick={handleResume} disabled={playbackState !== 'paused'} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-light-text dark:text-dark-text font-bold rounded-lg shadow-md hover:bg-slate-300 dark:hover:bg-slate-500 disabled:bg-slate-400 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors flex items-center" aria-label="Resume (Alt+R)"> <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg> Resume </button> <button onClick={handleStop} disabled={playbackState === 'idle'} className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg shadow-md hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors flex items-center" aria-label="Stop (Alt+S)"> <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 11-16 0 8 8 0 0116 0zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg> Stop </button> </div> </> )} </div> )} </> )} </div> );
=======
    return ( <div className="p-4 sm:p-6"> <ToolInputForm onSubmit={handleGenerate} isLoading={isLoading} placeholder="e.g., 'Verification and Validation from page 50'" cta="Generate Podcast Script" /> {isLoading ? <div className="flex justify-center mt-6"><LoadingSpinner /></div> : ( <> <ResponseDisplay content={script} error={error} source={script ? fileName : null} /> {script && !error && ( <div className="mt-4 flex justify-center flex-col items-center"> {!isSupported ? ( <p className="text-sm text-secondary dark:text-slate-400">Voice playback isn’t supported in this browser. Try Chrome/Edge/Safari.</p> ) : ( <> <div className="mb-4 w-full max-w-md flex items-center space-x-2"> <select value={selectedVoiceName || ''} onChange={handleVoiceChange} className="flex-1 p-2 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-light-card dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition" aria-label="Select voice"> {voices.map(voice => <option key={voice.name} value={voice.name}>{voice.name} ({voice.lang})</option>)} </select> <button onClick={testVoice} className="px-3 py-2 bg-slate-200 dark:bg-slate-600 text-light-text dark:text-dark-text font-bold rounded-lg shadow-md hover:bg-slate-300 dark:hover:bg-slate-500" aria-label="Test selected voice">Test voice</button> </div> <div className="flex flex-wrap items-center justify-center gap-2"> <button onClick={handlePlay} disabled={playbackState !== 'idle'} className="px-4 py-2 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-primary-dark disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors flex items-center" aria-label="Play (Alt+P)"> <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg> Play </button> <button onClick={handlePause} disabled={playbackState !== 'playing'} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-light-text dark:text-dark-text font-bold rounded-lg shadow-md hover:bg-slate-300 dark:hover:bg-slate-500 disabled:bg-slate-400 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors flex items-center" aria-label="Pause (Alt+U)"> <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg> Pause </button> <button onClick={handleResume} disabled={playbackState !== 'paused'} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-light-text dark:text-dark-text font-bold rounded-lg shadow-md hover:bg-slate-300 dark:hover:bg-slate-500 disabled:bg-slate-400 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors flex items-center" aria-label="Resume (Alt+R)"> <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg> Resume </button> <button onClick={handleStop} disabled={playbackState === 'idle'} className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg shadow-md hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors flex items-center" aria-label="Stop (Alt+S)"> <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 11-16 0 8 8 0 0116 0zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg> Stop </button> </div> </> )} </div> )} </> )} </div> );
>>>>>>> 85593d0 (Initial commit - AI Studio export)
};
const CertificateTool: React.FC<{ progress: ProgressData }> = ({ progress }) => {
    const { podcastSessions, summariesAccessed, flashcardDecksCreated } = progress;
    const topicsReviewed = podcastSessions + summariesAccessed + flashcardDecksCreated;
    const isReadyForCertificate = topicsReviewed >= TOTAL_CHAPTERS_FOR_CERTIFICATION;
    const [certificateText, setCertificateText] = useState('');
    const [copied, setCopied] = useState(false);
<<<<<<< HEAD

    useEffect(() => { const fetchCertificate = async () => { const text = await getCertificate(isReadyForCertificate); setCertificateText(text); }; fetchCertificate(); }, [isReadyForCertificate]);
    const handleCopy = () => { if (navigator.clipboard) { const cleanText = certificateText.replace('🎉 Congratulations, Max!\n', '').replace(/\n\nWould you like to save or share this on LinkedIn\?$/, ''); navigator.clipboard.writeText(cleanText); setCopied(true); setTimeout(() => setCopied(false), 2000); } };
    const handleDownload = () => { const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 800; const ctx = canvas.getContext('2d'); if (!ctx) return; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.strokeStyle = '#34D399'; ctx.lineWidth = 15; ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20); ctx.strokeStyle = '#475569'; ctx.lineWidth = 4; ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60); ctx.textAlign = 'center'; ctx.fillStyle = '#0f172a'; ctx.font = 'bold 60px serif'; ctx.fillText('Certificate of Completion', canvas.width / 2, 180); ctx.font = '28px serif'; ctx.fillText('This is to certify that', canvas.width / 2, 280); ctx.font = 'italic bold 70px cursive'; ctx.fillStyle = '#34D399'; ctx.fillText("Max", canvas.width / 2, 380); ctx.font = '28px serif'; ctx.fillStyle = '#475569'; ctx.fillText('has successfully completed all core modules of the', canvas.width / 2, 460); ctx.fillText('SE-ZERT Systems Engineering learning program.', canvas.width / 2, 510); ctx.font = '24px serif'; ctx.fillStyle = '#0f172a'; ctx.textAlign = 'center'; ctx.fillText(`Date: ${new Date().toLocaleDateString()}`, canvas.width / 4, 650); ctx.fillText('Tutor Signature', (canvas.width / 4) * 3, 650); ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(canvas.width / 4 - 100, 620); ctx.lineTo(canvas.width / 4 + 100, 620); ctx.stroke(); ctx.beginPath(); ctx.moveTo((canvas.width / 4) * 3 - 100, 620); ctx.lineTo((canvas.width / 4) * 3 + 100, 620); ctx.stroke(); const link = document.createElement('a'); link.download = 'SE-ZERT-Certificate-of-Completion.png'; link.href = canvas.toDataURL('image/png'); document.body.appendChild(link); link.click(); document.body.removeChild(link); };

    return ( <div className="p-4 sm:p-8 text-center animate-fade-in"> <h2 className="text-2xl font-bold mb-4">Your Certificate</h2> <div className="max-w-2xl mx-auto p-6 bg-light-card dark:bg-dark-card rounded-xl shadow-lg flex flex-col items-center"> <div className="whitespace-pre-wrap text-light-text dark:text-dark-text"> {certificateText ? certificateText : <LoadingSpinner />} </div> {isReadyForCertificate && certificateText && ( <div className="flex flex-col sm:flex-row items-center justify-center mt-6 space-y-3 sm:space-y-0 sm:space-x-4"> <button onClick={handleCopy} className="w-full sm:w-auto px-6 py-2 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-primary-dark transition-colors disabled:bg-slate-400" disabled={copied}> {copied ? 'Copied!' : 'Copy Certificate Text'} </button> <button onClick={handleDownload} className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition-colors flex items-center justify-center"> <DownloadIcon className="h-5 w-5 mr-2" /> Download Certificate </button> </div> )} </div> </div> );
=======
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => { const fetchCertificate = async () => { const text = await getCertificate(isReadyForCertificate); setCertificateText(text); }; fetchCertificate(); }, [isReadyForCertificate]);
    const handleCopy = () => { if (navigator.clipboard) { const cleanText = certificateText.replace('🎉 Congratulations, Max!\n', '').replace(/\n\nWould you like to save or share this on LinkedIn\?$/, ''); navigator.clipboard.writeText(cleanText); setCopied(true); setTimeout(() => setCopied(false), 2000); } };
    
    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            const imageUrl = await generateCertificateImage(progress, <SeZertLogo className="w-full h-full text-[#B48811]" />);
            const link = document.createElement('a');
            link.download = 'SE-ZERT-Certificate-of-Completion.png';
            link.href = imageUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Failed to generate certificate:", error);
            alert("Sorry, there was an error generating your certificate. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };


    return ( <div className="p-4 sm:p-8 text-center animate-fade-in"> <h2 className="text-2xl font-bold mb-4">Your Certificate</h2> <div className="max-w-2xl mx-auto p-6 bg-light-card dark:bg-dark-card rounded-xl shadow-lg flex flex-col items-center"> <div className="whitespace-pre-wrap text-light-text dark:text-dark-text"> {certificateText ? certificateText : <LoadingSpinner />} </div> {isReadyForCertificate && certificateText && ( <div className="flex flex-col sm:flex-row items-center justify-center mt-6 space-y-3 sm:space-y-0 sm:space-x-4"> <button onClick={handleCopy} className="w-full sm:w-auto px-6 py-2 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-primary-dark transition-colors disabled:bg-slate-400" disabled={copied}> {copied ? 'Copied!' : 'Copy Certificate Text'} </button> <button onClick={handleDownload} disabled={isGenerating} className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition-colors flex items-center justify-center disabled:bg-slate-400 disabled:cursor-wait"> <DownloadIcon className="h-5 w-5 mr-2" /> {isGenerating ? 'Generating...' : 'Download Certificate'} </button> </div> )} </div> </div> );
>>>>>>> 85593d0 (Initial commit - AI Studio export)
};

// --- MAIN APP ---
const App: React.FC = () => {
    const [view, setView] = useState<'dashboard' | 'homepage'>('dashboard');
    const [activeTool, setActiveTool] = useState<Tool>('search');
    const [isUploaderOpen, setIsUploaderOpen] = useState(false);
    const docContext = useContext(DocContext);

    const [progress, setProgress] = useState<ProgressData>(() => { try { const savedProgress = localStorage.getItem('seZertProgress'); return savedProgress ? JSON.parse(savedProgress) : initialProgress; } catch (error) { return initialProgress; } });
    useEffect(() => { localStorage.setItem('seZertProgress', JSON.stringify(progress)); }, [progress]);
    
    const handleViewCertificate = () => { setView('homepage'); setActiveTool('certificate'); };

    if (!docContext) { return <div className="flex items-center justify-center h-screen"><LoadingSpinner/></div>; }
    
    const { fileName, isProcessing } = docContext;

    return (
        <div className="flex flex-col h-screen font-sans text-light-text dark:text-dark-text bg-light-bg dark:bg-dark-bg">
            <header className="p-4 bg-light-card dark:bg-dark-card shadow-md z-10 flex flex-col items-center space-y-4 relative">
                <div className="flex items-center space-x-3">
                    <SeZertLogo className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                    <h1 className="text-xl sm:text-2xl font-bold text-light-text dark:text-dark-text">SE-ZERT Learning Assistant</h1>
                </div>
                <nav className="flex space-x-2">
                    <NavButton active={view === 'dashboard'} onClick={() => setView('dashboard')}> <ChartBarIcon /> <span>Dashboard</span> </NavButton>
                    <NavButton active={view === 'homepage'} onClick={() => setView('homepage')}> <HomeIcon /> <span>Homepage</span> </NavButton>
                    <NavButton active={isUploaderOpen} onClick={() => setIsUploaderOpen(prev => !prev)} className={fileName ? 'border-2 border-green-500' : ''}>
                        <UploadIcon className="h-6 w-6" />
                        <span>{isProcessing ? 'Processing...' : (fileName ? 'Change PDF' : 'Upload PDF')}</span>
                    </NavButton>
                </nav>
            </header>

            <main className="flex-1 overflow-y-auto">
                {isUploaderOpen && <div className="max-w-4xl mx-auto p-2"><UploadControl /></div>}
                <div className="max-w-4xl mx-auto h-full">
                    {view === 'dashboard' ? ( <Dashboard progress={progress} onStartLearning={() => setView('homepage')} onViewCertificate={handleViewCertificate} /> ) : (
                        <div className="flex flex-col h-full">
                             <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                    {tools.map(tool => (
                                        <button
                                            key={tool.id}
                                            onClick={() => setActiveTool(tool.id)}
                                            className={`flex flex-col items-center justify-center space-y-2 p-4 rounded-xl transition-all duration-200 transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-light-bg dark:focus:ring-offset-dark-bg focus:ring-primary
                                                ${activeTool === tool.id
                                                    ? 'bg-primary text-white shadow-lg scale-105'
                                                    : 'bg-light-card dark:bg-dark-card text-light-text dark:text-dark-text hover:bg-slate-100 dark:hover:bg-slate-800'
                                                }`
                                            }
                                        >
                                            {tool.icon}
                                            <span className="font-semibold text-sm text-center">{tool.name}</span>
                                        </button>
                                    ))}
                                </div>
                                {fileName && <div className="mt-4 text-center px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 text-xs font-bold rounded-full w-full max-w-md mx-auto truncate">Using: {fileName}</div>}
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {activeTool === 'search' && <SearchTool docContext={docContext} />}
                                {activeTool === 'flashcards' && <FlashcardsTool setProgress={setProgress} docContext={docContext} />}
                                {activeTool === 'summary' && <SummaryTool setProgress={setProgress} docContext={docContext} />}
                                {activeTool === 'podcast' && <PodcastTool setProgress={setProgress} docContext={docContext} />}
                                {activeTool === 'certificate' && <CertificateTool progress={progress} />}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default App;