import { GoogleGenAI, Type } from "@google/genai";
import { Worksheet, WorksheetFormState, QuestionType } from '../types';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY! });

const questionTypeMapping: { [key in QuestionType]: string } = {
  [QuestionType.MultipleChoice]: 'multiple-choice with 4 options and a correct answer',
  [QuestionType.FillInTheBlank]: 'fill-in-the-blank with a single correct answer',
  [QuestionType.OpenEnded]: 'open-ended comprehension question',
};

export const generateWorksheet = async (formData: WorksheetFormState): Promise<Worksheet> => {
  const selectedQuestionTypes = Object.entries(formData.questionTypes)
    .filter(([, isSelected]) => isSelected)
    .map(([type]) => questionTypeMapping[type as QuestionType])
    .join(', ');

  let prompt = `Create a worksheet for a ${formData.gradeLevel} student on the topic of "${formData.topic}".
The worksheet should have ${formData.numQuestions} questions.
The question types should be a mix of: ${selectedQuestionTypes}.
The title of the worksheet should be creative and related to the topic.
`;

  if (formData.includeAnswerKey) {
    prompt += `\nIMPORTANT: For EVERY question, you MUST provide a correct 'answer'. For open-ended questions, this should be a detailed, example correct answer. The answer key is critical.\n`;
  }

  if (formData.customInstructions) {
    prompt += `\nFollow these custom instructions: ${formData.customInstructions}\n`;
  }

  if (formData.sourceText) {
    prompt += `\nBase the questions on the following source text:\n"""\n${formData.sourceText}\n"""\n`;
  }
  
  if (formData.sourceLinks && formData.sourceLinks.length > 0) {
    prompt += `\nAlso, use the content from the following web pages as context:\n${formData.sourceLinks.join('\n')}\n`;
  }

  prompt += `\nReturn the worksheet as a JSON object. For multiple choice questions, provide an array of strings for 'options' and the correct 'answer'. For fill-in-the-blank, provide the 'answer' to be filled in. For open-ended questions, provide an example 'answer'. The question text for fill-in-the-blank should use "____" to indicate the blank.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Creative title for the worksheet.' },
      topic: { type: Type.STRING, description: 'The topic of the worksheet.' },
      questions: {
        type: Type.ARRAY,
        description: 'An array of questions for the worksheet.',
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING, description: 'The question text. For fill-in-the-blank, use "____" for the blank.' },
            // FIX: Removed unsupported 'enum' property from the schema and updated the description to guide the model on valid values.
            type: { type: Type.STRING, description: `The type of question. Must be one of: ${Object.values(QuestionType).join(", ")}.` },
            // FIX: Removed unsupported 'nullable' property. Properties are optional by not being in the 'required' array.
            options: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'An array of options for multiple-choice questions.' },
            // FIX: Removed unsupported 'nullable' property. Properties are optional by not being in the 'required' array.
            answer: { type: Type.STRING, description: 'The correct answer for the question. Required if an answer key is requested.' },
          },
          required: ['question', 'type'],
        },
      },
    },
    required: ['title', 'topic', 'questions'],
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });

    const jsonString = response.text.trim();
    const worksheetData = JSON.parse(jsonString);

    if (!worksheetData.title || !worksheetData.questions || !Array.isArray(worksheetData.questions)) {
      throw new Error("Invalid worksheet format received from API.");
    }

    return worksheetData as Worksheet;
  } catch (error) {
    console.error("Error generating worksheet:", error);
    throw new Error("Failed to generate worksheet. Please check your inputs and API key.");
  }
};
