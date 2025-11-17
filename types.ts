export enum QuestionType {
  MultipleChoice = 'multiple-choice',
  FillInTheBlank = 'fill-in-the-blank',
  OpenEnded = 'open-ended',
}

export interface Question {
  question: string;
  type: QuestionType;
  options?: string[]; // for multiple-choice
  answer?: string; // for multiple-choice and fill-in-the-blank
}

export interface Worksheet {
  title: string;
  topic: string;
  questions: Question[];
}

export interface WorksheetFormState {
  topic: string;
  gradeLevel: string;
  numQuestions: number;
  questionTypes: {
    [QuestionType.MultipleChoice]: boolean;
    [QuestionType.FillInTheBlank]: boolean;
    [QuestionType.OpenEnded]: boolean;
  };
  includeAnswerKey: boolean;
  customInstructions?: string;
  sourceText?: string;
  sourceLinks: string[];
}
