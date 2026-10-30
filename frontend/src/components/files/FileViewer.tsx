import React, { useState, useEffect } from 'react';
import {
  FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaFile,
  FaDownload, FaEye, FaTimes, FaFilePowerpoint, FaFileCsv,
  FaFileArchive, FaFileAlt
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';

// ────────────────────────────────────────────────────────────────────────────
// Sub-viewers
// ────────────────────────────────────────────────────────────────────────────

/** Renders plain-text / CSV content fetched from a URL */
const TextFileViewer: React.FC<{ url: string; isCSV?: boolean }> = ({ url, isCSV = false }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
        return res.text();
      })
      .then((data) => {
        setContent(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching text file:', err);
        setError(err.message || 'Failed to load file contents');
        setLoading(false);
      });
  }, [url]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-dark-lighter text-light">
        <div className="spinner w-12 h-12 border-4 border-t-yellow-500 border-r-transparent border-b-yellow-500 border-l-transparent rounded-full animate-spin mb-4"></div>
        <p>Loading file content…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-dark-lighter text-light p-6 text-center">
        <FaFile className="text-yellow-500 text-6xl mb-4" />
        <p className="text-red-400 font-semibold mb-2">Error loading preview</p>
        <p className="text-light-darker text-sm max-w-md mb-4">{error}</p>
        <a
          href={url}
          download
          className="bg-yellow-500/20 text-yellow-500 px-4 py-2 rounded-md font-medium hover:opacity-80 transition-colors"
        >
          Download File instead
        </a>
      </div>
    );
  }

  if (isCSV) {
    // Render CSV as an HTML table
    const rows = content.split('\n').filter((r) => r.trim().length > 0);
    const parsed = rows.map((row) => row.split(',').map((cell) => cell.trim().replace(/^"|"$/g, '')));

    return (
      <div className="w-full h-full overflow-auto bg-dark-lighter p-4">
        <table className="w-full border-collapse text-sm text-light">
          <thead>
            {parsed[0] && (
              <tr className="bg-dark-medium sticky top-0">
                {parsed[0].map((cell, i) => (
                  <th key={i} className="border border-dark-accent px-3 py-2 text-left font-semibold text-yellow-400">
                    {cell || `Column ${i + 1}`}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {parsed.slice(1).map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? 'bg-dark-lighter' : 'bg-dark-medium'}>
                {row.map((cell, ci) => (
                  <td key={ci} className="border border-dark-accent px-3 py-1.5">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-6 overflow-auto bg-dark-lighter text-light font-mono text-sm whitespace-pre-wrap select-text leading-relaxed">
      {content}
    </div>
  );
};

/** Renders an image */
const ImageViewer: React.FC<{ url: string; onError: () => void }> = ({ url, onError }) => (
  <div className="w-full h-full flex items-center justify-center bg-dark-medium p-4">
    <img
      src={url}
      alt="File Preview"
      className="max-w-full max-h-full object-contain rounded shadow-lg"
      onError={onError}
    />
  </div>
);

/** Renders a PDF via native browser iframe */
const PDFViewer: React.FC<{ url: string; onLoad: () => void; onError: () => void; loading: boolean }> = ({
  url, onLoad, onError, loading,
}) => (
  <div className="w-full h-full bg-dark-lighter rounded relative">
    {loading && (
      <div className="absolute inset-0 flex items-center justify-center z-10 bg-dark-medium bg-opacity-70">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-red-500 border-r-transparent border-b-red-500 border-l-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-light">Loading PDF…</p>
        </div>
      </div>
    )}
    <iframe src={url} className="w-full h-full border-0" title="PDF Viewer" onLoad={onLoad} onError={onError} />
  </div>
);

/** Renders Office / other docs via Microsoft Office Online viewer */
const OfficeOnlineViewer: React.FC<{
  url: string; label: string; onLoad: () => void; onError: () => void; loading: boolean;
}> = ({ url, label, onLoad, onError, loading }) => {
  const officeUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`;
  return (
    <div className="w-full h-full bg-dark-lighter rounded relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-dark-medium bg-opacity-70">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-light">Loading {label}…</p>
          </div>
        </div>
      )}
      <iframe
        src={officeUrl}
        className="w-full h-full border-0"
        title={`${label} Viewer`}
        onLoad={onLoad}
        onError={onError}
      />
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Safely extract file extension from a path or URL (strips query strings).
 */
function getExtension(fileUrl: string): string {
  try {
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      const pathname = new URL(fileUrl).pathname;
      return (pathname.split('.').pop() || '').toLowerCase();
    }
  } catch {
    // fall through
  }
  return (fileUrl.split('.').pop() || '').toLowerCase();
}

type FileCategory =
  | 'pdf'
  | 'word'
  | 'excel'
  | 'powerpoint'
  | 'image'
  | 'text'
  | 'csv'
  | 'archive'
  | 'unknown';

interface FileTypeInfo {
  type: FileCategory;
  icon: React.ElementType;
  label: string;
  color: string;
  bgColor: string;
}

function getFileTypeInfo(fileUrl: string): FileTypeInfo {
  const ext = getExtension(fileUrl);

  if (ext === 'pdf') {
    return { type: 'pdf', icon: FaFilePdf, label: 'PDF', color: 'text-red-500', bgColor: 'bg-red-500/20' };
  }
  if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) {
    return { type: 'word', icon: FaFileWord, label: 'Word Document', color: 'text-blue-500', bgColor: 'bg-blue-500/20' };
  }
  if (['xls', 'xlsx', 'ods'].includes(ext)) {
    return { type: 'excel', icon: FaFileExcel, label: 'Excel Spreadsheet', color: 'text-green-500', bgColor: 'bg-green-500/20' };
  }
  if (['ppt', 'pptx', 'odp'].includes(ext)) {
    return { type: 'powerpoint', icon: FaFilePowerpoint, label: 'Presentation', color: 'text-orange-500', bgColor: 'bg-orange-500/20' };
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tif', 'tiff', 'ico'].includes(ext)) {
    return { type: 'image', icon: FaFileImage, label: 'Image', color: 'text-purple-500', bgColor: 'bg-purple-500/20' };
  }
  if (ext === 'csv' || ext === 'tsv') {
    return { type: 'csv', icon: FaFileCsv, label: 'CSV Spreadsheet', color: 'text-teal-500', bgColor: 'bg-teal-500/20' };
  }
  if (ext === 'txt') {
    return { type: 'text', icon: FaFileAlt, label: 'Text File', color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' };
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return { type: 'archive', icon: FaFileArchive, label: 'Archive', color: 'text-gray-400', bgColor: 'bg-gray-500/20' };
  }
  return { type: 'unknown', icon: FaFile, label: 'File', color: 'text-gray-400', bgColor: 'bg-gray-500/20' };
}

// ────────────────────────────────────────────────────────────────────────────
// FileViewer component
// ────────────────────────────────────────────────────────────────────────────

interface FileViewerProps {
  fileUrl: string;
}

const FileViewer: React.FC<FileViewerProps> = ({ fileUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [absoluteFileUrl, setAbsoluteFileUrl] = useState('');

  // Resolve absolute URL
  useEffect(() => {
    if (!fileUrl) return;
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      setAbsoluteFileUrl(fileUrl);
    } else {
      const base = import.meta.env.VITE_WS_URL || 'http://localhost:5000';
      setAbsoluteFileUrl(fileUrl.startsWith('/') ? `${base}${fileUrl}` : `${base}/${fileUrl}`);
    }
  }, [fileUrl]);

  const fileType = getFileTypeInfo(fileUrl || absoluteFileUrl);

  const handleOpen = () => {
    setIsOpen(true);
    setViewerError(null);
    setIsLoading(true);
  };

  const handleClose = () => setIsOpen(false);
  const handleLoad = () => setIsLoading(false);
  const handleError = () => {
    setIsLoading(false);
    setViewerError('Preview failed to load.');
    toast.error('Preview could not be loaded. Try downloading the file.');
  };

  /** Fallback UI shown when a viewer fails */
  const FallbackActions = () => (
    <div className="flex flex-col items-center justify-center h-full">
      <fileType.icon className={`${fileType.color} text-8xl mb-6`} />
      <p className="text-light text-xl mb-2">{fileType.label}</p>
      <p className="text-light-darker mb-6 text-center max-w-md">
        Preview failed to load. You can download the file or open it in a new tab.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <a
          href={absoluteFileUrl}
          download
          className={`${fileType.bgColor} ${fileType.color} px-4 py-2 rounded-md font-medium hover:opacity-80 transition-colors flex items-center gap-2`}
        >
          <FaDownload /> Download File
        </a>
        <a
          href={absoluteFileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-dark text-light px-4 py-2 rounded-md font-medium hover:bg-dark-medium transition-colors flex items-center gap-2"
        >
          <FaEye /> Open in New Tab
        </a>
      </div>
    </div>
  );

  const renderPreview = () => {
    if (!absoluteFileUrl) return null;
    if (viewerError) return <FallbackActions />;

    switch (fileType.type) {
      case 'pdf':
        return (
          <PDFViewer
            url={absoluteFileUrl}
            onLoad={handleLoad}
            onError={handleError}
            loading={isLoading}
          />
        );

      case 'image':
        return (
          <ImageViewer
            url={absoluteFileUrl}
            onError={handleError}
          />
        );

      case 'text':
        return <TextFileViewer url={absoluteFileUrl} />;

      case 'csv':
        return <TextFileViewer url={absoluteFileUrl} isCSV />;

      case 'word':
      case 'excel':
      case 'powerpoint':
        return (
          <OfficeOnlineViewer
            url={absoluteFileUrl}
            label={fileType.label}
            onLoad={handleLoad}
            onError={handleError}
            loading={isLoading}
          />
        );

      case 'archive':
        // Archives can't be previewed; show download prompt immediately
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <fileType.icon className={`${fileType.color} text-8xl mb-6`} />
            <p className="text-light text-xl mb-2">{fileType.label}</p>
            <p className="text-light-darker mb-6 text-center max-w-md">
              Archive files cannot be previewed in the browser.
            </p>
            <a
              href={absoluteFileUrl}
              download
              className={`${fileType.bgColor} ${fileType.color} px-4 py-2 rounded-md font-medium hover:opacity-80 transition-colors flex items-center gap-2`}
            >
              <FaDownload /> Download Archive
            </a>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <fileType.icon className="text-gray-400 text-8xl mb-6" />
            <p className="text-light text-xl mb-2">{fileType.label || 'File'}</p>
            <p className="text-light-darker mb-6 text-center max-w-md">
              In-browser preview is not available for this file type.
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              <a
                href={absoluteFileUrl}
                download
                className="bg-gray-500/20 text-gray-400 px-4 py-2 rounded-md font-medium hover:opacity-80 transition-colors flex items-center gap-2"
              >
                <FaDownload /> Download File
              </a>
              <a
                href={absoluteFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-dark text-light px-4 py-2 rounded-md font-medium hover:bg-dark-medium transition-colors flex items-center gap-2"
              >
                <FaEye /> Open in New Tab
              </a>
            </div>
          </div>
        );
    }
  };

  return (
    <div>
      <button
        onClick={handleOpen}
        className={`flex items-center gap-2 ${fileType.bgColor} ${fileType.color} px-4 py-2 rounded-md hover:opacity-80 transition-colors`}
        title={`View ${fileType.label}`}
      >
        <FaEye /> View {fileType.label}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-[9999] overflow-hidden" style={{ isolation: 'isolate' }}>
          <div className="bg-dark-medium w-full h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3 bg-dark-lighter border-b border-dark-accent">
              <div className="flex items-center gap-2">
                <fileType.icon className={fileType.color} />
                <span className="text-light font-medium">{fileType.label} Viewer</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={absoluteFileUrl}
                  download
                  className="p-2 hover:bg-dark-medium rounded-full transition-colors"
                  title="Download file"
                >
                  <FaDownload className="text-light" />
                </a>
                <a
                  href={absoluteFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-dark-medium rounded-full transition-colors"
                  title="Open in new tab"
                >
                  <FaEye className="text-light" />
                </a>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-dark-medium rounded-full transition-colors"
                  title="Close viewer"
                >
                  <FaTimes className="text-light" />
                </button>
              </div>
            </div>

            {/* Viewer body */}
            <div className="flex-1 overflow-hidden bg-dark">
              {renderPreview()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileViewer;