import React, { useState } from 'react';
import { WorksheetForm } from './components/WorksheetForm';
import { WorksheetPreview } from './components/WorksheetPreview';
import { generateWorksheet } from './services/geminiService';
import { Worksheet, WorksheetFormState } from './types';
import { SparklesIcon } from './components/icons/SparklesIcon';

function App() {
  const [worksheet, setWorksheet] = useState<Worksheet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = async (formData: WorksheetFormState) => {
    setIsLoading(true);
    setError(null);
    setWorksheet(null);
    try {
      const generatedWorksheet = await generateWorksheet(formData);
      setWorksheet(generatedWorksheet);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <header className="text-center mb-10">
          <div className="flex items-center justify-center gap-3">
            <SparklesIcon className="h-10 w-10 text-indigo-600" />
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
              AI Worksheet Generator
            </h1>
          </div>
          <p className="mt-4 text-lg leading-6 text-gray-600">
            Create custom educational worksheets on any topic in seconds.
          </p>
        </header>

        <main>
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
            <WorksheetForm onSubmit={handleFormSubmit} isLoading={isLoading} />
          </div>

          {error && (
            <div className="mt-6 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {worksheet && !isLoading && <WorksheetPreview worksheet={worksheet} />}
        </main>

        <footer className="text-center mt-12 text-sm text-gray-500">
          <p>Powered by Google Gemini. For educational purposes only.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
