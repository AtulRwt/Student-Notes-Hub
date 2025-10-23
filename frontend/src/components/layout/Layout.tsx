import type { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen bg-dark">
      <Navbar />
      
      <main className="flex-grow w-full">
        {children}
      </main>
      
      <Footer />
      
      <Toaster 
        position="top-right" 
        toastOptions={{
          className: 'glass-light',
          style: {
            background: 'rgba(30, 30, 30, 0.9)',
            color: '#e2e2e2',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      />
    </div>
  );
};

export default Layout;