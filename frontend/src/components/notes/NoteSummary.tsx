import { useState, useEffect } from 'react';
import { FaRobot, FaSpinner, FaChevronDown, FaChevronUp, FaExclamationTriangle, FaUserCircle, FaLightbulb, FaCopy, FaInfo, FaBrain, FaChartLine } from 'react-icons/fa';
import { notesAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

interface NoteSummaryProps {
  noteId: string;
  existingSummary?: string;
}

const NoteSummary = ({ noteId, existingSummary }: NoteSummaryProps) => {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<string | null>(existingSummary || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  // Reset copied state after 2 seconds
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (copiedToClipboard) {
      timeout = setTimeout(() => setCopiedToClipboard(false), 2000);
    }
    return () => clearTimeout(timeout);
  }, [copiedToClipboard]);

  const generateSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await notesAPI.getSummary(noteId);
      setSummary(response.summary);
      setIsExpanded(true);
    } catch (err: any) {
      let errorMessage = err.response?.data?.error || 'Failed to generate summary';
      
      // Check for API key related errors
      if (errorMessage.includes('API key') || 
          errorMessage.includes('403 Forbidden') ||
          errorMessage.includes('without established identity')) {
        errorMessage = 'API key configuration error. The administrator needs to set up a valid Gemini API key in the backend.';
      }
      
      setError(errorMessage);
      toast.error('Failed to generate summary');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const copyToClipboard = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      setCopiedToClipboard(true);
      toast.success('Summary copied to clipboard');
    }
  };

  // Format the summary into bullet points if possible
  const formatSummary = (text: string) => {
    // Check if summary is already in bullet point format
    if (text.includes('• ') || text.includes('* ') || text.includes('- ')) {
      return text;
    }
    
    // Split by paragraphs and convert to bullet points
    const paragraphs = text.split('\n').filter(p => p.trim().length > 0);
    if (paragraphs.length <= 1) return text; // If just one paragraph, leave it as is
    
    return paragraphs.map(p => `• ${p}`).join('\n');
  };

  return (
    <motion.div 
      className="mt-6 glass rounded-lg overflow-hidden shadow-lg border border-blue-500/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div 
        className={`bg-gradient-to-r ${isExpanded ? 'from-blue-900/30 to-indigo-900/30' : 'from-blue-900/20 to-indigo-900/20'} 
          p-4 flex justify-between items-center cursor-pointer transition-all duration-300 hover:from-blue-900/40 hover:to-indigo-900/40`}
        onClick={summary ? toggleExpand : undefined}
      >
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
            <FaRobot className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium gradient-text">AI-Generated Summary</h3>
            {user && (
              <div className="flex items-center text-xs text-accent">
                <FaUserCircle className="mr-1" />
                <span>Personalized for {user.name}</span>
              </div>
            )}
          </div>
        </div>
        
        {!summary && !isLoading && !error && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              generateSummary();
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md flex items-center shadow-lg hover:shadow-blue-500/20"
          >
            <FaLightbulb className="mr-2" />
            Generate Summary
          </motion.button>
        )}
        
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-end"
          >
            <div className="flex items-center text-blue-400 mb-2">
              <FaSpinner className="animate-spin mr-2" />
              <span>Generating your summary...</span>
            </div>
            <div className="w-64">
              <div className="h-2 w-full bg-dark-lighter rounded-full mb-2 overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ 
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "linear",
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-accent">
                <span>Analyzing document</span>
                <span>Please wait...</span>
              </div>
            </div>
          </motion.div>
        )}
        
        {summary && (
          <div className="flex items-center">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                copyToClipboard();
              }}
              className={`mr-3 p-2 rounded-full ${copiedToClipboard ? 'bg-green-500/20 text-green-400' : 'bg-dark-lighter text-accent hover:text-blue-400'}`}
              title="Copy to clipboard"
            >
              <FaCopy />
            </motion.button>
            <motion.button 
              whileHover={{ y: isExpanded ? -2 : 2 }}
              className="text-blue-400"
            >
              {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
            </motion.button>
          </div>
        )}
      </div>
      
      <AnimatePresence>
        {summary && isExpanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-dark border-t border-blue-500/20">
              <div className="prose prose-invert max-w-none">
                {formatSummary(summary).split('\n').map((paragraph, i) => (
                  <p key={i} className={`mb-3 ${paragraph.startsWith('•') ? 'pl-4' : ''} text-light-darker`}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-red-900/20 border-t border-red-500/30">
              <div className="flex items-start text-red-400">
                <FaExclamationTriangle className="mr-2 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium">Summary generation failed</p>
                  <p>{error}</p>
                  {error.includes('API key') && (
                    <p className="mt-2 text-sm">
                      Please notify the administrator to set up the Gemini API key following the instructions in the README.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default NoteSummary; 