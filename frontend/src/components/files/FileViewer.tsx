import React, { useState, useEffect } from 'react';
import { FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFile, FaDownload, FaEye, FaTimes, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface FileViewerProps {
  fileUrl: string;
}

const FileViewer: React.FC<FileViewerProps> = ({ fileUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);
  // For PDF viewer
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState('');
  const [absoluteFileUrl, setAbsoluteFileUrl] = useState('');

  // Get absolute URL for file
  useEffect(() => {
    // Make sure we have a complete URL including the server address
    if (fileUrl) {
      // If fileUrl starts with http, it's already absolute
      if (fileUrl.startsWith('http')) {
        setAbsoluteFileUrl(fileUrl);
      } else {
        // Otherwise, construct the absolute URL
        const apiBaseUrl = import.meta.env.VITE_WS_URL || 'http://localhost:5000'; // Base URL for your backend
        const absoluteUrl = fileUrl.startsWith('/')
          ? `${apiBaseUrl}${fileUrl}`
          : `${apiBaseUrl}/${fileUrl}`;

        setAbsoluteFileUrl(absoluteUrl);
        console.log('Converted file URL:', fileUrl, 'to absolute:', absoluteUrl);
      }
    }
  }, [fileUrl]);

  const getFileType = () => {
    if (!fileUrl) return {
      type: 'unknown',
      icon: FaFile,
      label: 'File',
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/20'
    };

    const fileExt = fileUrl.split('.').pop()?.toLowerCase();

    if (fileExt === 'pdf') {
      return {
        type: 'pdf',
        icon: FaFilePdf,
        label: 'PDF',
        color: 'text-red-500',
        bgColor: 'bg-red-500/20'
      };
    } else if (['doc', 'docx'].includes(fileExt || '')) {
      return {
        type: 'word',
        icon: FaFileWord,
        label: 'Word Document',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/20'
      };
    } else if (['xls', 'xlsx'].includes(fileExt || '')) {
      return {
        type: 'excel',
        icon: FaFileExcel,
        label: 'Excel Spreadsheet',
        color: 'text-green-500',
        bgColor: 'bg-green-500/20'
      };
    } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExt || '')) {
      return {
        type: 'image',
        icon: FaFileImage,
        label: 'Image',
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/20'
      };
    } else {
      return {
        type: 'unknown',
        icon: FaFile,
        label: 'File',
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/20'
      };
    }
  };

  const fileType = getFileType();

  useEffect(() => {
    // If viewer is opened, set up the appropriate viewer
    if (isOpen && absoluteFileUrl) {
      setIsPdfLoading(true);

      if (fileType.type === 'pdf') {
        // Use Mozilla's PDF.js viewer for PDFs
        const pdfViewerCdnUrl = 'https://mozilla.github.io/pdf.js/web/viewer.html';
        const encodedPdfUrl = encodeURIComponent(absoluteFileUrl);
        const fullViewerUrl = `${pdfViewerCdnUrl}?file=${encodedPdfUrl}`;

        console.log('Setting up PDF viewer with URL:', fullViewerUrl);
        setPdfViewerUrl(fullViewerUrl);
      }
      // No need to set pdfViewerUrl for other file types as they use Google Docs Viewer directly in the iframe
    }
  }, [isOpen, fileType.type, absoluteFileUrl]);

  const handleError = (e: React.SyntheticEvent<HTMLElement>) => {
    console.error('Error loading file:', e);
    setViewerError("Unable to load the preview");

    // Try to fetch the file directly to check if it's accessible
    fetch(absoluteFileUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        console.log('File is accessible via fetch, but viewer failed');

        // If this is a Word or Excel file, show a specific message about Google Docs viewer
        if (fileType.type === 'word' || fileType.type === 'excel') {
          toast.error('Google Docs viewer could not display this file. Try downloading it instead.');
        }
      })
      .catch(error => {
        console.error('File fetch error:', error);
        toast.error(`File access error: ${error.message}`);
      });
  };

  const handlePdfLoad = () => {
    setIsPdfLoading(false);
  };

  // Function to create a Microsoft Office Online viewer URL
  const createOfficeOnlineViewerUrl = (fileUrl: string) => {
    // Microsoft Office Online viewer URL pattern
    return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fileUrl)}`;
  };

  // Function to create Google Docs viewer URL  
  const createGoogleDocsViewerUrl = (fileUrl: string) => {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
  };

  const renderFilePreview = () => {
    switch (fileType.type) {
      case 'pdf':
        return (
          <div className="w-full h-full bg-dark-lighter rounded relative">
            {!viewerError ? (
              <>
                {isPdfLoading && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 bg-dark-medium bg-opacity-70">
                    <div className="text-center">
                      <div className="spinner w-12 h-12 border-4 border-t-red-500 border-r-transparent border-b-red-500 border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-light">Loading PDF...</p>
                    </div>
                  </div>
                )}
                <iframe
                  src={pdfViewerUrl}
                  className="w-full h-full border-0"
                  title="PDF Viewer"
                  onLoad={handlePdfLoad}
                  onError={handleError}
                  sandbox="allow-scripts allow-same-origin allow-forms"
                  referrerPolicy="no-referrer"
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <fileType.icon className={`${fileType.color} text-6xl mb-4`} />
                <p className="text-light">PDF preview failed to load</p>
                <p className="text-light-darker text-sm mb-4">The PDF viewer couldn't display this document</p>
                <div className="flex space-x-4">
                  <a
                    href={absoluteFileUrl}
                    download
                    className={`${fileType.bgColor} ${fileType.color} px-4 py-2 rounded-md font-medium hover:opacity-80 transition-colors flex items-center`}
                  >
                    <FaDownload className="mr-2" /> Download PDF
                  </a>
                  <a
                    href={absoluteFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-dark text-light px-4 py-2 rounded-md font-medium hover:bg-dark-medium transition-colors flex items-center"
                  >
                    <FaEye className="mr-2" /> Open in New Tab
                  </a>
                </div>
              </div>
            )}
          </div>
        );

      case 'image':
        return (
          <div className="w-full h-full flex items-center justify-center bg-dark-medium">
            <img
              src={absoluteFileUrl}
              alt="File Preview"
              className="max-w-full max-h-full object-contain"
              onError={handleError}
            />
            {viewerError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-medium bg-opacity-90">
                <fileType.icon className={`${fileType.color} text-6xl mb-4`} />
                <p className="text-light">Image failed to load</p>
                <a
                  href={absoluteFileUrl}
                  download
                  className="gradient-border bg-dark px-4 py-2 rounded-md font-medium hover:bg-dark-light transition-colors mt-4"
                >
                  <FaDownload className="mr-2 inline" /> Download Image
                </a>
              </div>
            )}
          </div>
        );

      case 'word':
      case 'excel':
        // Use Microsoft Office Online viewer for Word and Excel documents
        return (
          <div className="w-full h-full bg-dark-lighter rounded relative">
            {!viewerError ? (
              <>
                {isPdfLoading && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 bg-dark-medium bg-opacity-70">
                    <div className="text-center">
                      <div className="spinner w-12 h-12 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-light">Loading Document...</p>
                    </div>
                  </div>
                )}
                <iframe
                  src={createOfficeOnlineViewerUrl(absoluteFileUrl)}
                  className="w-full h-full border-0"
                  title={`${fileType.label} Viewer`}
                  onLoad={handlePdfLoad}
                  onError={handleError}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <fileType.icon className={`${fileType.color} text-6xl mb-4`} />
                <p className="text-light">{fileType.label} preview failed to load</p>
                <p className="text-light-darker text-sm mb-4">Microsoft Office Online viewer cannot access local files. Try downloading instead.</p>
                <div className="flex space-x-4">
                  <a
                    href={absoluteFileUrl}
                    download
                    className={`${fileType.bgColor} ${fileType.color} px-4 py-2 rounded-md font-medium hover:opacity-80 transition-colors flex items-center`}
                  >
                    <FaDownload className="mr-2" /> Download {fileType.label}
                  </a>
                  <a
                    href={absoluteFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-dark text-light px-4 py-2 rounded-md font-medium hover:bg-dark-medium transition-colors flex items-center"
                  >
                    <FaEye className="mr-2" /> Open in New Tab
                  </a>
                </div>
              </div>
            )}
          </div>
        );

      default:
        // Simplified view for other document types with clear message about limitations
        return (
          <div className="flex flex-col items-center justify-center h-full bg-dark-lighter rounded relative">
            <fileType.icon className={`${fileType.color} text-8xl mb-6`} />
            <p className="text-light text-xl mb-2">{fileType.label || 'File'}</p>
            <p className="text-light-darker mb-6 text-center max-w-md">
              Online preview isn't available for local files. <br />
              This feature will work when deployed to a public server.
            </p>
            <div className="flex space-x-4">
              <a
                href={absoluteFileUrl}
                download
                className={`${fileType.bgColor} ${fileType.color} px-4 py-2 rounded-md font-medium hover:opacity-80 transition-colors flex items-center`}
              >
                <FaDownload className="mr-2" /> Download File
              </a>
              <a
                href={absoluteFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-dark text-light px-4 py-2 rounded-md font-medium hover:bg-dark-medium transition-colors flex items-center"
              >
                <FaEye className="mr-2" /> Open in Browser
              </a>
            </div>
          </div>
        );
    }
  };

  return (
    <div>
      <button
        onClick={() => {
          setIsOpen(true);
          setViewerError(null); // Reset any previous errors
          setIsPdfLoading(true); // Always start with loading state for PDFs

          // Show helpful message for non-PDF files in local development
          if (fileType.type !== 'pdf' && fileType.type !== 'image') {
            toast(
              "Online document preview requires a publicly accessible URL. " +
              "When deployed to a public server, this feature will work properly.",
              {
                duration: 5000,
                icon: '📄'
              }
            );
          }
        }}
        className={`flex items-center ${fileType.bgColor} ${fileType.color} px-4 py-2 rounded-md hover:opacity-80 transition-colors`}
        title={`View ${fileType.label}`}
      >
        <FaEye className="mr-2" /> View {fileType.label}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-medium rounded-lg overflow-hidden w-full max-w-5xl h-4/5 flex flex-col">
            <div className="flex justify-between items-center p-3 bg-dark-lighter">
              <div className="flex items-center">
                <fileType.icon className={`${fileType.color} mr-2`} />
                <span className="text-light font-medium">
                  {fileType.label} Viewer
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={absoluteFileUrl}
                  download
                  className="p-2 hover:bg-dark-medium rounded-full transition-colors"
                  title="Download file"
                >
                  <FaDownload className="text-light" />
                </a>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-dark-medium rounded-full transition-colors"
                  title="Close viewer"
                >
                  <FaTimes className="text-light" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-dark">
              {renderFilePreview()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileViewer;