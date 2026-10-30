# AI Auto-Fill Feature for Document Upload

## ✨ Feature Overview
I've added an **AI-powered auto-fill** feature to your Student Notes Hub. When you upload a document (PDF, Word, etc.), AI automatically analyzes it and fills in the form fields like title, description, tags, and semester.

## 🎯 How It Works

1. **Upload Document**: When you select a file in the "Upload New Note" form
2. **AI Analysis**: The backend extracts text from the document and sends it to Google Gemini AI
3. **Metadata Extraction**: AI analyzes the content to suggest:
   - **Title**: A concise, descriptive title
   - **Description**: A 2-3 sentence summary of what the document covers
   - **Tags**: 3-5 relevant keywords/subjects
   - **Semester**: If mentioned in the document (e.g., "Sem 1", "Sem 2")
   - **Confidence Level**: High, medium, or low based on content clarity
4. **Auto-Fill**: Form fields are automatically populated
5. **Edit & Submit**: You can review and edit any AI-suggested values before saving

## 📝 Implementation Details

### Backend Changes

#### 1. Enhanced Gemini Service (`backend/src/services/ai/gemini.ts`)
Added `extractDocumentMetadata()` method that:
- Extracts text from PDFs, Word docs, and images
- Sends the content to Gemini AI with a structured prompt
- Returns metadata in JSON format
- Provides fallback values if AI is unavailable

#### 2. New Upload Endpoint (`backend/src/routes/upload.ts`)
Added `POST /api/upload/extract-metadata` endpoint that:
- Accepts file upload with authentication
- Calls Gemini service to extract metadata
- Returns file info + AI-suggested metadata
- Handles errors gracefully (returns file even if AI fails)

## 🚀 Next Steps Required

### **IMPORTANT**: The frontend code update didn't apply cleanly. You need to manually add the AI auto-fill feature to `frontend/src/components/notes/NoteForm.tsx`:

1. Add these imports at the top:
\`\`\`typescript
import { FaRobot, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
\`\`\`

2. Add these state variables after the existing state:
\`\`\`typescript
const [isExtractingMetadata, setIsExtractingMetadata] = useState<boolean>(false);
const [aiSuggestions, setAiSuggestions] = useState<any>(null);
\`\`\`

3. Add this function above `handleFileChange`:
\`\`\`typescript
const extractMetadataFromFile = async (file: File) => {
  setIsExtractingMetadata(true);
  toast.loading('AI is analyzing your document...', { id: 'ai-extract' });

  try {
    const token = localStorage.getItem('token');
    const formDataToSend = new FormData();
    formDataToSend.append('file', file);

    const response = await axios.post(
      \`\${API_URL}/upload/extract-metadata\`,
      formDataToSend,
      {
        headers: {
          'Authorization': \`Bearer \${token}\`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    if (response.data.metadata) {
      const metadata = response.data.metadata;
      setAiSuggestions(metadata);

      // Auto-fill form fields with AI suggestions
      setFormData(prev => ({
        ...prev,
        title: metadata.title || prev.title,
        description: metadata.description || prev.description,
        tags: metadata.suggestedTags && metadata.suggestedTags.length > 0 
          ? metadata.suggestedTags 
          : prev.tags,
        semester: metadata.detectedSemester || prev.semester
      }));

      toast.success(
        \`✨ AI filled the form! (Confidence: \${metadata.confidence})\`,
        { id: 'ai-extract', duration: 4000 }
      );
    } else {
      toast.error('Could not extract metadata. Please fill manually.', { id: 'ai-extract' });
    }
  } catch (error: any) {
    console.error('Metadata extraction failed:', error);
    toast.error('AI analysis failed. Please fill the form manually.', { id: 'ai-extract' });
  } finally {
    setIsExtractingMetadata(false);
  }
};
\`\`\`

4. Update `handleFileChange` to be async and call metadata extraction at the end:
\`\`\`typescript
const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0] || null;
  // ... existing validation code ...
  
  if (file) {
    // ... existing file processing code ...
    
    // ADD THIS AT THE END:
    await extractMetadataFromFile(fileToUpload);
  } else {
    // ... existing else block ...
    setAiSuggestions(null); // ADD THIS LINE
  }
};
\`\`\`

5. Add this AI suggestions banner in the form JSX (after the h1 title):
\`\`\`tsx
{aiSuggestions && (
  <div className="mb-6 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
    <div className="flex items-start gap-3">
      <FaRobot className="text-blue-400 text-xl mt-1 flex-shrink-0" />
      <div className="flex-1">
        <h3 className="text-blue-400 font-semibold flex items-center gap-2 mb-2">
          <FaCheckCircle className="text-green-400" />
          AI Auto-Fill Completed
        </h3>
        <p className="text-sm text-light-darker mb-2">
          The form has been automatically filled based on your document. 
          You can edit any field before submitting.
        </p>
        <div className="text-xs text-accent">
          Confidence: <span className={\`font-semibold \${
            aiSuggestions.confidence === 'high' ? 'text-green-400' :
            aiSuggestions.confidence === 'medium' ? 'text-yellow-400' :
            'text-orange-400'
          }\`}>{aiSuggestions.confidence}</span>
        </div>
      </div>
    </div>
  </div>
)}
\`\`\`

## 🧪 Testing

1. Start both backend and frontend: `npm run dev`
2. Navigate to "Upload New Note"
3. Select a PDF or Word document
4. Watch the AI analyze and auto-fill the form
5. Edit any fields if needed
6. Submit the note

## 💡 Tips

- **Confidence Levels**:
  - **High**: Clear, well-structured academic content
  - **Medium**: Partial information detected
  - **Low**: Unclear content or fallback suggestions

- **Supported File Types**: PDF, Word (.doc/.docx), Excel (.xls/.xlsx), and Images
- **Max File Size**: 10MB
- **AI Timeout**: If AI takes too long, fallback metadata is provided

## 🔮 Future Enhancements

- OCR for scanned documents/images
- Multi-language support
- Course auto-detection from content
- Batch upload with AI analysis
- AI-powered content recommendations
