import React from 'react';
import { Worksheet, Question, QuestionType } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';

// Add type definitions for jspdf and html2canvas which are loaded from a CDN
declare global {
  interface Window {
    html2canvas: any;
    jspdf: any;
  }
}

const renderQuestion = (question: Question, index: number) => {
  const questionNumber = index + 1;
  switch (question.type) {
    case QuestionType.MultipleChoice:
      return (
        <div key={index}>
          <p className="font-semibold">{questionNumber}. {question.question}</p>
          <div className="mt-2 space-y-2 pl-6">
            {question.options?.map((option, i) => (
              <div key={i} className="flex items-center">
                <span className="mr-2 font-mono">{String.fromCharCode(65 + i)}.</span>
                <span>{option}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case QuestionType.FillInTheBlank:
      return (
        <div key={index}>
          <p className="font-semibold">{questionNumber}. {question.question.replace(/____/g, '________________')}</p>
        </div>
      );
    case QuestionType.OpenEnded:
      return (
        <div key={index}>
          <p className="font-semibold">{questionNumber}. {question.question}</p>
          <div className="mt-2 h-24 rounded-md border border-dashed border-gray-300"></div>
        </div>
      );
    default:
      return null;
  }
};

interface WorksheetPreviewProps {
  worksheet: Worksheet;
}

export const WorksheetPreview: React.FC<WorksheetPreviewProps> = ({ worksheet }) => {
  const handleDownloadPdf = () => {
    const { jsPDF } = window.jspdf;
    const input = document.getElementById('printable-worksheet');
    if (input) {
      window.html2canvas(input, { scale: 2, useCORS: true })
        .then((canvas: HTMLCanvasElement) => {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });
  
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const canvasWidth = canvas.width;
          const canvasHeight = canvas.height;
          const ratio = canvasWidth / canvasHeight;
          const imgHeight = pdfWidth / ratio;
          
          let heightLeft = imgHeight;
          let position = 0;
  
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
          heightLeft -= pdfHeight;
  
          while (heightLeft > 0) {
              position = position - pdfHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
              heightLeft -= pdfHeight;
          }
  
          const safeTitle = (worksheet.title || 'worksheet').replace(/[\\/:"*?<>| ]/g, '_');
          pdf.save(`${safeTitle}.pdf`);
        });
    }
  };

  const hasAnswerKey = worksheet.questions.some(q => q.answer);

  return (
    <div className="mt-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Worksheet Preview</h2>
        <button
          onClick={handleDownloadPdf}
          type="button"
          className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <DownloadIcon className="-ml-0.5 h-5 w-5" />
          Download PDF
        </button>
      </div>

      <div id="printable-worksheet" className="bg-white p-8 shadow-lg rounded-lg border border-gray-200">
        <header className="mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold text-center text-gray-800">{worksheet.title}</h1>
          <p className="text-center text-gray-500 mt-2">Topic: {worksheet.topic}</p>
          <div className="flex justify-between mt-4 text-sm">
            <span>Name: _________________________</span>
            <span>Date: _________________________</span>
          </div>
        </header>

        <main className="space-y-6">
          {worksheet.questions.map(renderQuestion)}
        </main>
        
        {hasAnswerKey && (
          <section id="answer-key" className="mt-10 pt-6 border-t-2 border-dashed border-gray-400">
            <h2 className="text-2xl font-bold text-center mb-6">Answer Key</h2>
            <ol className="space-y-4">
              {worksheet.questions.map((question, index) => (
                question.answer ? (
                  <li key={`ans-${index}`} className="text-sm">
                    <span className="font-bold">{index + 1}.</span>
                    <span className="ml-2 font-semibold text-gray-700">{question.answer}</span>
                  </li>
                ) : null
              ))}
            </ol>
          </section>
        )}
      </div>
    </div>
  );
};