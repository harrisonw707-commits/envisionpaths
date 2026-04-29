import { generateAI } from './aiService';

export interface CoachOptions {
  jobTitle: string;
  questionsAsked: number;
  interviewLength: number;
  isFree?: boolean;
  isPro?: boolean;
}

/**
 * Generates the system instruction for the interview coach.
 */
export function getCoachSystemInstruction(options: CoachOptions): string {
  const { jobTitle, questionsAsked, interviewLength, isFree, isPro } = options;
  
  return `You are an expert career coach. 
Conduct a realistic interview for a ${jobTitle} role. 
Focus on standard interview questions.
After the user answers a question, briefly acknowledge their answer with a "Coach's Tip" (in italics) 
and then move on to the next insightful interview question. 
Focus on behavioral, technical, and situational questions.

MANDATORY: At some point during the interview (preferably towards the middle), you MUST ask the candidate: "Describe yourself with one word."

CRITICAL: You have currently asked ${questionsAsked} questions. 
The target interview length is ${interviewLength} questions.
If you have reached ${interviewLength} questions, do NOT ask another question. 
Instead, say: "That concludes our interview session! I've gathered enough information to provide your performance report. Please click the 'End Session' button to see your results."`;
}

/**
 * Generates the next question or response from the coach.
 */
export async function getCoachResponse(
  message: string,
  history: any[],
  options: CoachOptions
) {
  const systemInstruction = getCoachSystemInstruction(options);
  const prompt = `System: ${systemInstruction}\n\nHistory: ${JSON.stringify(history)}\n\nUser: ${message}`;
  const response = await generateAI(prompt);
  return response.text;
}

/**
 * Streams the coach's response.
 */
export async function streamCoachResponse(
  message: string,
  onChunk: (chunk: string) => void,
  history: any[],
  options: CoachOptions
) {
  const response = await getCoachResponse(message, history, options);
  onChunk(response);
  return response;
}

/**
 * Generates an initial interview question.
 */
export async function getInitialQuestion(jobTitle: string, industry: string) {
  const prompt = `You are a professional career coach and expert interviewer at EnvisionPaths. 
I am applying for the position of ${jobTitle} in the ${industry} industry. 
Please start the interview by saying exactly: "Welcome, thanks for coming in!" followed by a brief introduction and your first interview question: "Tell me about yourself."
Keep your tone professional, encouraging, and insightful.`;
  
  const response = await generateAI(prompt);
  return response.text;
}

/**
 * Generates a performance report based on the interview transcript.
 */
export async function getPerformanceReport(transcript: string, jobTitle: string) {
  const prompt = `You are an expert career coach. Analyze the following interview transcript for a ${jobTitle} role. 
Provide a comprehensive, advanced performance analysis including:
1. Overall Performance Score (out of 10)
2. Key Strengths (3 points)
3. Areas for Improvement (3 points)
4. A final encouraging "Roadmap to Success" for this candidate.

Format the response clearly with headings.

Interview Transcript:
${transcript}`;

  const response = await generateAI(prompt);
  return response.text;
}
