import { FaGithub } from 'react-icons/fa';

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
          
          <div className="gradient-border p-2 rounded-full flex justify-center items-center bg-dark">
            <a
              href="https://github.com/yourusername/student-notes-hub"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              <FaGithub className="w-6 h-6" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 