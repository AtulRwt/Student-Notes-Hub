import { FaGithub, FaCommentAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="glass-light border-t border-blue-800/20 mt-8 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="gradient-text text-lg font-semibold">
              &copy; {currentYear} Student Notes & Resource Sharing Hub
            </p>
            <p className="text-xs text-blue-400/70 mt-1">
              Share knowledge, collaborate, and succeed together
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-4">
            <Link
              to="/feedback"
              className="flex items-center px-4 py-2 rounded-md bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 transition-colors border border-blue-500/30"
            >
              <FaCommentAlt className="mr-2" /> 
              <span className="font-medium">Send Feedback</span>
            </Link>
            
            <div className="gradient-border p-2 rounded-full flex justify-center items-center bg-dark">
              <a
                href="https://github.com/AtulRwt/Student-Notes-Hub"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                <FaGithub className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 