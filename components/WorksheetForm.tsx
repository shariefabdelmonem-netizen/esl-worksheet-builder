import React, { useState } from 'react';
import { WorksheetFormState, QuestionType } from '../types';
import { Spinner } from './Spinner';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { CheckSquareIcon } from './icons/CheckSquareIcon';
import { ListIcon } from './icons/ListIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { UploadIcon } from './icons/UploadIcon';
import { TrashIcon } from './icons/TrashIcon';
import { KeyIcon } from './icons/KeyIcon';
import { LinkIcon } from './icons/LinkIcon';

interface WorksheetFormProps {
  onSubmit: (formData: WorksheetFormState) => void;
  isLoading: boolean;
}

const gradeLevels = ['Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade', 'High School', 'College'];

export const WorksheetForm: React.FC<WorksheetFormProps> = ({ onSubmit, isLoading }) => {
  const [formState, setFormState] = useState<WorksheetFormState>({
    topic: '',
    gradeLevel: '5th Grade',
    numQuestions: 5,
    questionTypes: {
      [QuestionType.MultipleChoice]: true,
      [QuestionType.FillInTheBlank]: true,
      [QuestionType.OpenEnded]: false,
    },
    includeAnswerKey: true,
    customInstructions: '',
    sourceText: '',
    sourceLinks: [],
  });
  const [sourceFileName, setSourceFileName] = useState<string | null>(null);
  const [currentLink, setCurrentLink] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    setFormState(prevState => ({ ...prevState, [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value }));
  };

  const handleNumQuestionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState(prevState => ({ ...prevState, numQuestions: parseInt(e.target.value, 10) }));
  };

  const handleQuestionTypeChange = (type: QuestionType) => {
    setFormState(prevState => ({
      ...prevState,
      questionTypes: {
        ...prevState.questionTypes,
        [type]: !prevState.questionTypes[type],
      },
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // 10 MB limit
      alert('File size exceeds 10MB. Please select a smaller file.');
      removeSourceText();
      return;
    }

    setSourceFileName(file.name);
    let textContent = '';

    try {
        if (file.type === 'text/plain') {
            textContent = await file.text();
        } else if (file.type === 'application/pdf') {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await (window as any).pdfjsLib.getDocument(arrayBuffer).promise;
            let text = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                text += content.items.map((item: any) => item.str).join(' ');
            }
            textContent = text;
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const arrayBuffer = await file.arrayBuffer();
            const result = await (window as any).mammoth.extractRawText({ arrayBuffer });
            textContent = result.value;
        } else {
            alert('Unsupported file type. Please upload .txt, .pdf, or .docx');
            removeSourceText();
            return;
        }
        setFormState(prevState => ({ ...prevState, sourceText: textContent }));
    } catch (error) {
        console.error('Error processing file:', error);
        alert('There was an error reading the file.');
        removeSourceText();
    }
  };

  const removeSourceText = () => {
    setFormState(prevState => ({ ...prevState, sourceText: ''}));
    setSourceFileName(null);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  const handleAddLink = () => {
    if (currentLink && !formState.sourceLinks.includes(currentLink)) {
        try {
            new URL(currentLink); // Basic validation
            setFormState(prevState => ({ ...prevState, sourceLinks: [...prevState.sourceLinks, currentLink] }));
            setCurrentLink('');
        } catch (_) {
            alert('Please enter a valid URL.');
        }
    }
  };

  const handleRemoveLink = (linkToRemove: string) => {
    setFormState(prevState => ({ ...prevState, sourceLinks: prevState.sourceLinks.filter(link => link !== linkToRemove) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formState);
  };

  const isAtLeastOneQuestionTypeSelected = Object.values(formState.questionTypes).some(v => v);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        <div>
            <label htmlFor="topic" className="block text-sm font-medium leading-6 text-gray-900">Worksheet Topic</label>
            <div className="mt-2">
                <input type="text" name="topic" id="topic" value={formState.topic} onChange={handleInputChange} className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" placeholder="e.g., The Solar System" required />
            </div>
        </div>
        
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
                <label htmlFor="gradeLevel" className="block text-sm font-medium leading-6 text-gray-900">Grade Level</label>
                <select id="gradeLevel" name="gradeLevel" value={formState.gradeLevel} onChange={handleInputChange} className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6">
                    {gradeLevels.map(level => <option key={level}>{level}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="numQuestions" className="block text-sm font-medium leading-6 text-gray-900">Number of Questions ({formState.numQuestions})</label>
                <input id="numQuestions" type="range" min="1" max="20" value={formState.numQuestions} onChange={handleNumQuestionsChange} className="mt-2 block w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium leading-6 text-gray-900">Question Types & Options</label>
            <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <QuestionTypeButton type={QuestionType.MultipleChoice} label="Multiple Choice" Icon={CheckSquareIcon} selected={formState.questionTypes[QuestionType.MultipleChoice]} onClick={handleQuestionTypeChange} />
                <QuestionTypeButton type={QuestionType.FillInTheBlank} label="Fill-in-the-Blank" Icon={ListIcon} selected={formState.questionTypes[QuestionType.FillInTheBlank]} onClick={handleQuestionTypeChange} />
                <QuestionTypeButton type={QuestionType.OpenEnded} label="Open Ended" Icon={BookOpenIcon} selected={formState.questionTypes[QuestionType.OpenEnded]} onClick={handleQuestionTypeChange} />
                <div className="relative flex items-start">
                  <div className="flex h-6 items-center">
                    <input id="includeAnswerKey" name="includeAnswerKey" type="checkbox" checked={formState.includeAnswerKey} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
                  </div>
                  <div className="ml-3 text-sm leading-6">
                    <label htmlFor="includeAnswerKey" className="font-medium text-gray-900 flex items-center"><KeyIcon className="h-5 w-5 mr-2 text-gray-400" />Include Answer Key</label>
                  </div>
                </div>
            </div>
            {!isAtLeastOneQuestionTypeSelected && <p className="mt-2 text-sm text-red-600">Please select at least one question type.</p>}
        </div>

        <div>
            <label htmlFor="customInstructions" className="block text-sm font-medium leading-6 text-gray-900">Custom Instructions (Optional)</label>
            <textarea id="customInstructions" name="customInstructions" rows={2} value={formState.customInstructions} onChange={handleInputChange} className="mt-2 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" placeholder="e.g., Focus on the planets' atmospheres."></textarea>
        </div>

        <div className="space-y-4">
            <label className="block text-sm font-medium leading-6 text-gray-900">Resources (Optional)</label>
            <p className="text-sm text-gray-500 -mt-3">Base the worksheet on specific documents or web pages.</p>
            {/* File Upload */}
            {sourceFileName ? (
                <div className="flex items-center justify-between rounded-lg border border-gray-300 bg-gray-50 p-2">
                    <p className="truncate text-sm font-medium text-gray-700">{sourceFileName}</p>
                    <button type="button" onClick={removeSourceText} className="text-gray-500 hover:text-gray-700"><TrashIcon className="h-5 w-5" /></button>
                </div>
            ) : (
                <div className="flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-6">
                    <div className="text-center">
                        <UploadIcon className="mx-auto h-10 w-10 text-gray-300" />
                        <div className="mt-2 flex text-sm leading-6 text-gray-600">
                            <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500">
                                <span>Upload a file</span>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".txt,.pdf,.docx" />
                            </label>
                        </div>
                        <p className="text-xs leading-5 text-gray-600">TXT, PDF, DOCX up to 10MB</p>
                    </div>
                </div>
            )}
            <textarea name="sourceText" rows={4} value={formState.sourceText} onChange={handleInputChange} className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" placeholder="...or paste source text here. Uploading a file will replace this text."></textarea>
            {/* Link Input */}
            <div>
              <div className="flex rounded-md shadow-sm">
                <div className="relative flex flex-grow items-stretch focus-within:z-10">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><LinkIcon className="h-5 w-5 text-gray-400" /></div>
                  <input type="url" value={currentLink} onChange={(e) => setCurrentLink(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLink())} className="block w-full rounded-none rounded-l-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" placeholder="https://example.com" />
                </div>
                <button type="button" onClick={handleAddLink} className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Add Link</button>
              </div>
              <ul className="mt-2 space-y-1">
                {formState.sourceLinks.map(link => (
                    <li key={link} className="flex items-center justify-between text-sm text-indigo-600 bg-indigo-50 rounded p-1.5">
                        <a href={link} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">{link}</a>
                        <button type="button" onClick={() => handleRemoveLink(link)} className="text-indigo-400 hover:text-indigo-600"><TrashIcon className="h-4 w-4" /></button>
                    </li>
                ))}
              </ul>
            </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end">
        <button type="submit" disabled={isLoading || !isAtLeastOneQuestionTypeSelected} className="flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed">
          {isLoading ? <><Spinner /> Generating...</> : <><SparklesIcon className="h-5 w-5 mr-2" /> Generate Worksheet</>}
        </button>
      </div>
    </form>
  );
};

interface QuestionTypeButtonProps {
    type: QuestionType;
    label: string;
    Icon: React.FC<{className?: string}>;
    selected: boolean;
    onClick: (type: QuestionType) => void;
}

const QuestionTypeButton: React.FC<QuestionTypeButtonProps> = ({ type, label, Icon, selected, onClick }) => {
    return (
        <button type="button" onClick={() => onClick(type)} className={`relative flex items-center space-x-3 rounded-lg border px-4 py-3 shadow-sm focus:outline-none ${selected ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-gray-300'}`}>
            <Icon className={`h-6 w-6 ${selected ? 'text-indigo-600' : 'text-gray-400'}`} />
            <span className="font-medium text-gray-900">{label}</span>
        </button>
    );
}