// Question types and processing logic

export type QuestionType = 'regular' | 'coding' | 'mcq' | 'image';

export interface Question {
  text: string;
  type: QuestionType;
  options?: string[]; // For MCQ questions
  imageUrl?: string; // For image-based questions
}

export class QuestionHandler {
  static processQuestions(rawQuestions: any[]): Question[] {
    if (!rawQuestions || !rawQuestions.length) return [];
    
    return rawQuestions.map((question) => {
      // If question is already in the right format
      if (typeof question === "object" && question.type) {
        return question as Question;
      }
      
      // Process string questions
      if (typeof question === "string") {
        // Check for coding questions
        if (question.includes("[CODING]")) {
          return {
            text: question.replace("[CODING]", "").trim(),
            type: "coding",
          };
        }
        
        // Add more question type detection here in the future
        // e.g., if (question.includes("[MCQ]")) { ... }
        
        // Default to regular question
        return {
          text: question,
          type: "regular",
        };
      }
      
      // Fallback for any other format
      return {
        text: typeof question === "object" ? question.text || "" : String(question),
        type: "regular",
      };
    });
  }
  
  static formatQuestionsForAPI(questions: Question[]): string {
    return questions.map((q) => 
      `- ${q.text} ${q.type !== 'regular' ? `[${q.type.toUpperCase()}]` : ""}`
    ).join("\n");
  }
  
  static checkForCodeRequest(message: string): boolean {
    const codeRequestPatterns = [
      /write (a|some) code/i,
      /implement (a|the) function/i,
      /code (a|the) solution/i,
      /solve this problem/i,
      /coding question/i,
      /show me your code/i,
      /can you code/i,
      /please code/i,
      /write a program/i,
      /implement an algorithm/i,
    ];

    return codeRequestPatterns.some((pattern) => pattern.test(message));
  }
}