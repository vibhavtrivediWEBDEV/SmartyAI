import * as careerPlanRepo from '@/modules/career/career-plan.repository';
import type { PlanStep } from '@/lib/career/types';
import { getUserAIContextById } from '@/lib/ai/userAIContext.server';
import { ObjectId } from 'mongodb';
import {
  createCalendar,
  createEvent,
  findCalendarsByUserId,
  updateEvent
} from '@/modules/calendar/calendar.repository';
import { upsertCareerInterview } from '@/modules/interviews/interview.repository';
import { createWorkspace } from '@/modules/workspace/workspace.repository';
import { createCareerTeachingSession } from '@/modules/teaching/teaching.repository';
import type { WorkspaceFile } from '@/lib/types/workspace';
import { findUserById } from '@/modules/users/user.repository';
import { getATSDraft, saveATSDraft } from '@/modules/profile/atsDraft.repository';
import { generatedResumeDiagnostic, scoreResume } from '@/lib/ats/scoring';
import * as careerMissionRepo from '@/modules/career/career.repository';
import type { ATSResume } from '@/lib/ats/types';
import type { CareerTaskOpenTarget, TaskType } from '@/modules/career/career.types';
import {
  extractJobProfileDirect,
  generateNotesDirect,
  generateCalendarEventsDirect,
  generateLearningPlanDirect,
  generateInterviewSessionDirect
} from './ai-functions';

interface ExecutionContext {
  planId: string;
  missionId: string;
  userId: string;
  company?: string;
  role?: string;
  jobDescription?: string;
  interviewDate?: Date;
  jobProfile?: any;
  userProfile?: any;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const taskTypes = new Set<TaskType>(['teacher', 'interview', 'coding', 'youtube', 'notes', 'calendar', 'telegram', 'mail', 'resume']);
const taskOpenTargets = new Set<CareerTaskOpenTarget>(['notes', 'ai-book', 'interview', 'vscode', 'teacher', 'youtube', 'career']);

function normalizeTaskIntent(event: any, isInterview: boolean): { type: TaskType; openIn: CareerTaskOpenTarget[] } {
  const type: TaskType = isInterview
    ? 'interview'
    : taskTypes.has(event.taskType) ? event.taskType : 'calendar';
  const requested = Array.isArray(event.openIn)
    ? event.openIn.filter((target: unknown): target is CareerTaskOpenTarget => taskOpenTargets.has(target as CareerTaskOpenTarget))
    : [];
  const inferred: CareerTaskOpenTarget = type === 'coding'
    ? 'vscode'
    : type === 'teacher' ? 'teacher'
      : type === 'notes' ? 'notes'
        : type === 'interview' ? 'interview' : 'ai-book';
  return { type, openIn: Array.from(new Set([...(requested.length ? requested : [inferred]), 'career' as const])) };
}

function normalizePreparationDate(
  value: unknown,
  startDate: Date,
  interviewDate: Date,
  fallbackIndex: number
): string {
  const candidate = String(value || '').slice(0, 10);
  const startKey = toDateKey(startDate);
  const interviewKey = toDateKey(interviewDate);

  if (/^\d{4}-\d{2}-\d{2}$/.test(candidate) && candidate >= startKey && candidate <= interviewKey) {
    return candidate;
  }

  const normalized = new Date(`${startKey}T00:00:00.000Z`);
  normalized.setUTCDate(normalized.getUTCDate() + fallbackIndex);
  return toDateKey(normalized) > interviewKey ? interviewKey : toDateKey(normalized);
}

function createCodingExerciseFile(exercise: any, index: number, context: ExecutionContext): WorkspaceFile {
  const title = String(exercise.title || `Exercise ${index + 1}`);
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `exercise-${index + 1}`;
  const hint = [
    title,
    exercise.description,
    exercise.language,
    ...(Array.isArray(exercise.topics) ? exercise.topics : []),
    ...(context.jobProfile?.technologies || []),
    context.role,
  ].filter(Boolean).join(' ').toLowerCase();
  const header = `${title}\n * Difficulty: ${exercise.difficulty || 'medium'}\n * Topics: ${(exercise.topics || []).join(', ')}\n *\n * ${exercise.description || ''}`;

  if (/mongodb|mongoose|aggregation/.test(hint)) {
    return { path: `exercises/${String(index + 1).padStart(2, '0')}-${slug}.mongodb`, language: 'json', content: `[\n  { "$match": { } },\n  { "$group": { "_id": null, "total": { "$sum": 1 } } }\n]` };
  }
  if (/\bsql\b|postgres|mysql|database query/.test(hint)) {
    return { path: `exercises/${String(index + 1).padStart(2, '0')}-${slug}.sql`, language: 'sql', content: `-- ${title}\n-- ${exercise.description || 'Write your query below.'}\n\nSELECT *\nFROM table_name;` };
  }
  if (/python|django|flask/.test(hint)) {
    return { path: `exercises/${String(index + 1).padStart(2, '0')}-${slug}.py`, language: 'python', content: `"""\n${title}\n${exercise.description || ''}\n"""\n\ndef solution():\n    # Write your solution here.\n    pass\n\n\nif __name__ == "__main__":\n    print(solution())\n` };
  }
  if (/\bjava\b|spring/.test(hint)) {
    return { path: `exercises/${String(index + 1).padStart(2, '0')}-${slug}.java`, language: 'java', content: `/*\n * ${header}\n */\nclass Solution {\n    public static void main(String[] args) {\n        // Write your solution here.\n    }\n}\n` };
  }
  if (/react|tsx|jsx|component|hook|usestate|useeffect|context api|redux|next\.?js/.test(hint)) {
    const typed = /tsx|typescript|\bts\b/.test(hint);
    const extension = typed ? 'tsx' : 'jsx';
    const returnType = typed ? ': React.ReactElement' : '';
    return { path: `exercises/${String(index + 1).padStart(2, '0')}-${slug}.${extension}`, language: typed ? 'typescript' : 'javascript', content: `import React from 'react';\n\n/**\n * ${header}\n */\nexport default function App()${returnType} {\n  return <main>Build your solution here.</main>;\n}\n` };
  }
  if (/html|css|dom/.test(hint)) {
    return { path: `exercises/${String(index + 1).padStart(2, '0')}-${slug}.html`, language: 'html', content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${title}</title>\n</head>\n<body>\n  <main id="app"><!-- Build your solution here. --></main>\n</body>\n</html>` };
  }
  if (/typescript|\bts\b/.test(hint)) {
    return { path: `exercises/${String(index + 1).padStart(2, '0')}-${slug}.ts`, language: 'typescript', content: `/**\n * ${header}\n */\nfunction solution(): unknown {\n  // Write your solution here.\n}\n\nconsole.log(solution());\n` };
  }
  return { path: `exercises/${String(index + 1).padStart(2, '0')}-${slug}.js`, language: 'javascript', content: `/**\n * ${header}\n */\nfunction solution() {\n  // Write your solution here.\n}\n\nconsole.log(solution());\n` };
}

function createCareerWorkspaceFiles(exerciseFile: WorkspaceFile, projectName: string): WorkspaceFile[] {
  if (!/\.tsx?$|\.jsx$/.test(exerciseFile.path) || exerciseFile.path.endsWith('.ts')) return [exerciseFile];

  const typed = exerciseFile.path.endsWith('.tsx');
  const mainFile = typed ? 'src/main.tsx' : 'src/main.jsx';
  const appFile = typed ? 'src/App.tsx' : 'src/App.jsx';
  return [
    {
      path: 'package.json',
      language: 'json',
      content: JSON.stringify({
        name: projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        private: true,
        version: '1.0.0',
        scripts: { start: 'vite', build: 'vite build' },
        dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
        devDependencies: {
          '@vitejs/plugin-react': '^4.3.4',
          vite: '^6.0.0',
          ...(typed ? { typescript: '^5.7.2', '@types/react': '^18.3.12', '@types/react-dom': '^18.3.1' } : {})
        }
      }, null, 2)
    },
    {
      path: 'index.html',
      language: 'html',
      content: `<!doctype html>\n<html lang="en">\n<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Career Coding Practice</title></head>\n<body><div id="root"></div><script type="module" src="/${mainFile}"></script></body>\n</html>`
    },
    {
      path: mainFile,
      language: typed ? 'typescript' : 'javascript',
      content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './styles.css';\n\nReactDOM.createRoot(document.getElementById('root')${typed ? '!' : ''}).render(\n  <React.StrictMode><App /></React.StrictMode>\n);\n`
    },
    {
      path: 'src/styles.css',
      language: 'css',
      content: `:root { font-family: Inter, sans-serif; color: #18181b; background: #f4f4f5; }\n* { box-sizing: border-box; }\nbody { margin: 0; min-width: 320px; min-height: 100vh; }\nbutton, input { font: inherit; }\n`
    },
    { ...exerciseFile, path: appFile }
  ];
}

function careerEntryPoint(exerciseFile: WorkspaceFile): string {
  if (exerciseFile.path.endsWith('.tsx')) return 'src/App.tsx';
  if (exerciseFile.path.endsWith('.jsx')) return 'src/App.jsx';
  return exerciseFile.path;
}

function runtimeForFile(file: WorkspaceFile) {
  const extension = file.path.split('.').pop()?.toLowerCase();
  if (extension === 'tsx') return 'react-ts' as const;
  if (extension === 'jsx') return 'react' as const;
  if (extension === 'html') return 'html' as const;
  if (extension === 'py') return 'python' as const;
  if (extension === 'java') return 'java' as const;
  if (extension === 'sql') return 'sql' as const;
  if (extension === 'mongodb') return 'mongodb' as const;
  if (extension === 'ts') return 'typescript' as const;
  return 'node' as const;
}

export function createCareerCodingWorkspaceSpec(task: {
  title: string;
  description?: string;
  topic?: string;
  type?: string;
}) {
  const exerciseFile = createCodingExerciseFile({
    title: task.title,
    description: task.description,
    topics: [task.topic, task.type].filter(Boolean)
  }, 0, {
    planId: '',
    missionId: '',
    userId: '',
    role: ''
  });
  const name = `Career - ${task.title}`;
  return {
    name,
    description: task.description || `Coding workspace for ${task.title}`,
    files: createCareerWorkspaceFiles(exerciseFile, name),
    runtime: runtimeForFile(exerciseFile),
    entryPoint: careerEntryPoint(exerciseFile)
  };
}

export class CareerPlanExecutor {
  /**
   * Execute a specific step in the career plan
   */
  async executeStep(stepId: string, planId: string, context: ExecutionContext): Promise<any> {
    // Get the plan
    const plan = await careerPlanRepo.findPlanById(planId);
    
    if (!plan) {
      throw new Error('Plan not found');
    }
    
    const step = plan.steps.find((s: PlanStep) => s.id === stepId);
    if (!step) {
      throw new Error('Step not found');
    }
    
    console.log(`[CareerPlanExecutor] Executing step: ${step.name}`);
    
    try {
      // Mark step as in progress
      await careerPlanRepo.updatePlanStep(planId, stepId, {
        status: 'in_progress',
        progress: 10
      });
      
      let output: any;
      
      // Execute based on step type - USE AI POWERED FUNCTIONS
      switch (step.stepType) {
        case 'analyze_profile':
          output = await this.executeAnalyzeProfile(context);
          break;
        case 'generate_notes':
          output = await this.executeGenerateNotes(context);
          break;
        case 'schedule_sessions':
          output = await this.executeScheduleSessions(context);
          break;
        case 'setup_learning':
          output = await this.executeSetupLearning(context);
          break;
        case 'mock_interview':
          output = await this.executeMockInterview(context);
          break;
        default:
          throw new Error(`Unknown step type: ${step.stepType}`);
      }
      
      // Mark step as completed
      await careerPlanRepo.updatePlanStep(planId, stepId, {
        status: 'completed',
        progress: 100,
        output
      });
      
      return output;
    } catch (error: any) {
      // Mark step as failed
      await careerPlanRepo.updatePlanStep(planId, stepId, {
        status: 'failed',
        progress: 0,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Step 1: Analyze user profile and job description - AI POWERED
   */
  private async executeAnalyzeProfile(context: ExecutionContext): Promise<any> {
    console.log('[Step 1] Analyzing user profile with AI...');
    console.log('[Step 1] Context:', {
      userId: context.userId,
      company: context.company,
      role: context.role,
      hasJobDescription: !!context.jobDescription
    });
    
    // Use existing getUserAIContextById helper from userAIContext.ts
    let userProfileData: any = null;
    
    try {
      console.log('[Step 1] Fetching user profile using getUserAIContextById...');
      userProfileData = await getUserAIContextById(context.userId);
      console.log('[Step 1] Fetched user profile:', {
        name: userProfileData?.displayName,
        skills: userProfileData?.skills?.length || 0
      });
    } catch (error) {
      console.log('[Step 1] Warning: Failed to fetch profile, continuing without it');
    }
    
    // Call AI directly - NO HTTP NEEDED
    console.log('[Step 1] Calling AI analysis directly...');
    
    try {
      const analysisResult = await extractJobProfileDirect({
        company: context.company || '',
        role: context.role || '',
        jobDescription: context.jobDescription || '',
        userProfile: userProfileData
      });
      
      console.log('[Step 1] Analysis result received:', {
        hasJobProfile: !!analysisResult.jobProfile,
        hasSkillGaps: !!analysisResult.skillGaps,
        skillGapsCount: analysisResult.skillGaps?.length || 0
      });
      
      // Save analysis to plan
      await careerPlanRepo.updatePlan(context.planId, {
        userProfile: userProfileData || {},
        jobProfile: analysisResult.jobProfile || {},
        skillGaps: analysisResult.skillGaps || []
      } as any);

      const resumeArtifact = await this.prepareResumeArtifact(context);
      
      return { ...analysisResult, userProfile: userProfileData || {}, resumeArtifact };
    } catch (error: any) {
      console.error('[Step 1] Error during analysis:', error.message);
      console.error('[Step 1] Stack:', error.stack);
      throw error;
    }
  }

  private async prepareResumeArtifact(context: ExecutionContext) {
    const [user, existingDraft] = await Promise.all([
      findUserById(context.userId),
      getATSDraft(context.userId)
    ]);
    const profile = user?.resumeProfile;
    if (!profile && !existingDraft?.draft) return null;

    const draft: ATSResume = existingDraft?.draft || {
      name: profile?.name || '',
      email: profile?.email || '',
      phone: profile?.phone || '',
      location: profile?.location || '',
      headline: profile?.headline || context.role || '',
      summary: profile?.about || '',
      skills: profile?.skills || [],
      experience: profile?.experience || [],
      companies: profile?.companies || [],
      education: profile?.education || [],
      projects: profile?.projects || [],
      achievements: profile?.achievements || [],
      certifications: profile?.certifications || [],
      languages: profile?.languages || [],
      socialLinks: profile?.socialLinks || [],
      externalLinks: profile?.externalLinks || []
    };
    const jobDescription = context.jobDescription || existingDraft?.jobDescription || '';
    const score = scoreResume(draft, jobDescription, generatedResumeDiagnostic(draft));
    const saved = await saveATSDraft(context.userId, {
      draft,
      jobDescription,
      latestScores: score.categories,
      sourceResumeExtractionVersion: user?.resumeExtractionVersion || 0,
      selectedTemplate: existingDraft?.selectedTemplate || 'classic'
    });
    const artifactId = `ats-draft:${context.userId}`;
    await careerMissionRepo.updateMission(context.missionId, { resumeVersion: artifactId });
    return { id: artifactId, score: score.total, updatedAt: saved?.updatedAt };
  }
  
  /**
   * Step 2: Generate interview notes - AI POWERED
   */
  private async executeGenerateNotes(context: ExecutionContext): Promise<any> {
    console.log('[Step 2] Generating interview notes with AI...');
    
    try {
      // Call AI directly - NO HTTP NEEDED
      const notesResult = await generateNotesDirect({
        company: context.company || '',
        role: context.role || '',
        jobProfile: context.jobProfile,
        userProfile: context.userProfile,
        skillGaps: context.jobProfile?.skillGaps || []
      });
      
      // Create each note in database
      const createdNotes = [];
      for (const note of notesResult.notes || []) {
        const noteId = await careerPlanRepo.createNote({
          userId: new ObjectId(context.userId),
          missionId: new ObjectId(context.missionId),
          title: note.title,
          content: note.content,
          category: note.category || 'career',
          tags: note.tags || ['interview'],
          source: 'career-agent'
        });
        createdNotes.push({ noteId, ...note });
      }
      
      // Save notes to plan
      await careerPlanRepo.updatePlan(context.planId, {
        generatedNotes: {
          total: createdNotes.length,
          notes: createdNotes
        }
      } as any);
      
      return { notes: createdNotes };
    } catch (error: any) {
      console.error('[Step 2] Error:', error.message);
      throw error;
    }
  }
  
  /**
   * Step 3: Schedule preparation sessions - AI POWERED
   */
  private async executeScheduleSessions(context: ExecutionContext): Promise<any> {
    console.log('[Step 3] Scheduling preparation sessions with AI...');
    
    if (!context.interviewDate) {
      throw new Error('Interview date required');
    }
    
    const startDate = new Date();
    const daysUntilInterview = Math.ceil(
      (context.interviewDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    try {
      // Call AI directly - NO HTTP NEEDED
      const eventsResult = await generateCalendarEventsDirect({
        company: context.company || '',
        role: context.role || '',
        jobProfile: context.jobProfile,
        userProfile: context.userProfile,
        skillGaps: context.jobProfile?.skillGaps || [],
        interviewDate: context.interviewDate.toISOString(),
        startDate: startDate.toISOString(),
        daysUntilInterview
      });
      
      let calendars = await findCalendarsByUserId(context.userId);
      if (calendars.length === 0) {
        await createCalendar({
          userId: context.userId,
          name: 'Personal',
          color: '#3b82f6',
          visible: true
        });
        calendars = await findCalendarsByUserId(context.userId);
      }

      const calendarId = calendars[0]?._id.toHexString();
      if (!calendarId) {
        throw new Error('Unable to create a calendar for preparation sessions');
      }

      const createdEvents = [];
      const existingTasks = await careerMissionRepo.findTasksByMission(context.missionId);
      const existingPlan = await careerPlanRepo.findPlanById(context.planId);
      const existingEvents = (existingPlan as any)?.calendarEvents?.events || [];
      const fallbackDates = new Map<string, number>();
      for (const [eventIndex, event] of (eventsResult.events || []).entries()) {
        const sourceDate = String(event.date || '').slice(0, 10);
        if (!fallbackDates.has(sourceDate)) {
          fallbackDates.set(sourceDate, fallbackDates.size);
        }
        const date = normalizePreparationDate(
          event.date,
          startDate,
          context.interviewDate,
          fallbackDates.get(sourceDate) || 0
        );
        const eventInput = {
          userId: context.userId,
          calendarId,
          title: event.title,
          date,
          startTime: event.startTime,
          endTime: event.endTime,
          allDay: event.allDay || false,
          description: event.description,
          location: event.location || 'Online',
          reminder: event.reminder || 10,
          source: 'automation'
        } as const;
        const previousEvent = existingEvents.find((item: any) => item.title === event.title)
          || existingEvents[eventIndex];
        let persistedEventId = previousEvent?.eventId;
        if (persistedEventId) {
          await updateEvent(persistedEventId, eventInput);
        } else {
          persistedEventId = await createEvent(eventInput);
        }

        createdEvents.push({ ...event, eventId: persistedEventId, date });
        const scheduledDate = new Date(`${date}T${event.startTime || '09:00'}:00Z`);
        const isInterview = /mock interview/i.test(`${event.title} ${event.description || ''}`);
        const taskIntent = normalizeTaskIntent(event, isInterview);
        const existingTask = existingTasks.find((task) => task.title === event.title)
          || existingTasks[eventIndex];
        const taskResult = {
          ...(existingTask?.result || {}),
          calendarEventId: persistedEventId,
          scheduledAt: scheduledDate
        };
        if (existingTask) {
          await careerMissionRepo.updateTask(existingTask.id, {
            title: event.title,
            description: event.description,
            scheduledDate,
            duration: event.duration || 60,
            topic: event.title,
            type: taskIntent.type,
            openIn: taskIntent.openIn,
            result: taskResult
          });
        } else {
          await careerMissionRepo.createTask({
            missionId: context.missionId,
            userId: context.userId,
            type: taskIntent.type,
            openIn: taskIntent.openIn,
            title: event.title,
            description: event.description,
            scheduledDate,
            duration: event.duration || 60,
            status: 'pending',
            topic: event.title,
            result: taskResult,
            retryCount: 0,
            maxRetries: 0
          });
        }
      }

      if (createdEvents.length === 0) {
        throw new Error('AI did not generate any preparation sessions');
      }
      
      await careerPlanRepo.updatePlan(context.planId, {
        calendarEvents: {
          total: createdEvents.length,
          events: createdEvents
        }
      } as any);
      
      return { events: createdEvents };
    } catch (error: any) {
      console.error('[Step 3] Error:', error.message);
      throw error;
    }
  }
  
  /**
   * Step 4: Setup learning resources - AI POWERED
   */
  private async executeSetupLearning(context: ExecutionContext): Promise<any> {
    console.log('[Step 4] Setting up learning resources with AI...');
    
    const startDate = new Date();
    const daysUntilInterview = context.interviewDate 
      ? Math.ceil((context.interviewDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      : 7;
    
    try {
      // Call AI directly - NO HTTP NEEDED
      const learningResult = await generateLearningPlanDirect({
        company: context.company || '',
        role: context.role || '',
        jobProfile: context.jobProfile,
        userProfile: context.userProfile,
        skillGaps: context.jobProfile?.skillGaps || [],
        daysUntilInterview
      });

      if (!Array.isArray(learningResult.lessons) || learningResult.lessons.length === 0) {
        throw new Error('AI did not generate any teacher lessons');
      }
      if (!Array.isArray(learningResult.codingExercises) || learningResult.codingExercises.length === 0) {
        throw new Error('AI did not generate any coding exercises');
      }

      const teacherSessions = await Promise.all(
        learningResult.lessons.map((lesson: any) => createCareerTeachingSession({
          userId: context.userId,
          missionId: context.missionId,
          subject: 'Computer Science',
          topic: String(lesson.topic || `${context.role || 'Career'} interview preparation`),
          summary: Array.isArray(lesson.concepts) ? lesson.concepts.join(', ') : '',
          keyPoints: Array.isArray(lesson.concepts) ? lesson.concepts.map(String) : [],
          exercises: Array.isArray(lesson.exercises) ? lesson.exercises.map(String) : []
        }))
      );

      const exerciseFiles: WorkspaceFile[] = learningResult.codingExercises.map(
        (exercise: any, index: number) => createCodingExerciseFile(exercise, index, context)
      );
      const workspaceArtifacts = await Promise.all(exerciseFiles.map(async (exerciseFile, index) => {
        const exerciseTitle = String(learningResult.codingExercises[index]?.title || `Exercise ${index + 1}`);
        const workspaceName = `${context.company || context.role || 'Interview'} - ${exerciseTitle}`;
        const files = createCareerWorkspaceFiles(exerciseFile, workspaceName);
        const entryPoint = careerEntryPoint(exerciseFile);
        const workspace = await createWorkspace(context.userId, {
          name: workspaceName,
          description: String(learningResult.codingExercises[index]?.description || `Generated exercise for ${context.role || 'interview preparation'}`),
          files,
          settings: { runtime: runtimeForFile(exerciseFile), entryPoint },
          tags: ['career', 'coding-practice', context.missionId]
        });
        return { workspace, files, exerciseFile, entryPoint };
      }));
      const primaryWorkspace = workspaceArtifacts[0];

      const resourceTopics = Array.from(new Set([
        ...(learningResult.topics || []),
        ...(context.jobProfile?.skillGaps || []).map((gap: any) => gap.skill).filter(Boolean),
        `${context.role || 'Job'} interview preparation`
      ])).slice(0, 10) as string[];
      const youtubeResources = resourceTopics.map((topic) => {
        const searchQuery = `${context.company || ''} ${context.role || ''} ${topic} interview preparation`.trim();
        return {
          title: `${topic} interview preparation`,
          provider: 'youtube',
          searchQuery,
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`
        };
      });
      const learningResources = {
        ...learningResult,
        youtubeResources,
        teacherSessionIds: teacherSessions.map((session) => session.id),
        workspaceFiles: exerciseFiles,
        workspaceId: primaryWorkspace.workspace.id,
        workspaceIds: workspaceArtifacts.map(({ workspace }) => workspace.id)
      };

      const codingTasks = (await careerMissionRepo.findTasksByMission(context.missionId))
        .filter((task) => task.type === 'coding')
        .sort((left, right) => new Date(left.scheduledDate).getTime() - new Date(right.scheduledDate).getTime());
      await Promise.all(codingTasks.map((task, index) => careerMissionRepo.updateTask(task.id, {
        result: {
          ...(task.result || {}),
          workspaceId: (workspaceArtifacts[index] || primaryWorkspace).workspace.id,
          filePath: (workspaceArtifacts[index] || primaryWorkspace).entryPoint,
          exerciseIndex: index
        }
      })));
      
      // Create learning session
      const sessionId = await careerPlanRepo.createLearningSession({
        userId: new ObjectId(context.userId),
        missionId: new ObjectId(context.missionId),
        topic: `${context.role} Interview Prep`,
        company: context.company,
        resources: learningResources,
        status: 'active'
      });
      
      await careerPlanRepo.updatePlan(context.planId, {
        learningResources: {
          sessionId,
          ...learningResources
        }
      } as any);
      
      return { sessionId, ...learningResources };
    } catch (error: any) {
      console.error('[Step 4] Error:', error.message);
      throw error;
    }
  }
  
  /**
   * Step 5: Setup mock interview - AI POWERED
   */
  private async executeMockInterview(context: ExecutionContext): Promise<any> {
    console.log('[Step 5] Setting up mock interview with AI...');
    
    try {
      // Call AI directly - NO HTTP NEEDED
      const interviewResult = await generateInterviewSessionDirect({
        company: context.company || '',
        role: context.role || '',
        jobProfile: context.jobProfile,
        userProfile: context.userProfile
      });

      if (!Array.isArray(interviewResult.questions) || interviewResult.questions.length === 0) {
        throw new Error('AI did not generate any interview questions');
      }

      const questions = interviewResult.questions.map((question: any, index: number) => ({
        id: String(question.id || `career-${context.missionId}-${index + 1}`),
        text: String(question.question || question.text || ''),
        type: question.category === 'coding' ? 'coding' as const : 'regular' as const,
        category: question.category === 'system-design' ? 'technical' : question.category,
        difficulty: question.difficulty,
        evaluationCriteria: [question.expectedAnswer, ...(question.followUpQuestions || [])].filter(Boolean)
      })).filter((question: any) => question.text);

      if (questions.length === 0) {
        throw new Error('AI did not generate any usable interview questions');
      }

      const interviewTask = (
        await careerMissionRepo.findTasksByMission(context.missionId)
      ).find((task) => task.type === 'interview');
      if (!interviewTask) {
        throw new Error('Scheduled interview task is missing');
      }

      const interviewId = await upsertCareerInterview({
        userId: new ObjectId(context.userId),
        missionId: new ObjectId(context.missionId),
        careerTaskId: new ObjectId(interviewTask.id),
        scheduledAt: interviewTask.scheduledDate,
        calendarEventId: interviewTask.result?.calendarEventId,
        role: context.role || 'Interview Preparation',
        type: 'mixed',
        level: 'intermediate',
        techstack: context.jobProfile?.technologies || context.jobProfile?.requiredSkills || [],
        questions,
        jobDescription: context.jobDescription,
        finalized: true,
        coverImage: '/covers/adobe.png'
      });

      await careerPlanRepo.createInterviewSession({
        userId: new ObjectId(context.userId),
        missionId: new ObjectId(context.missionId),
        interviewId: new ObjectId(interviewId),
        company: context.company,
        role: context.role,
        type: 'technical',
        status: 'scheduled',
        questions: interviewResult.questions
      });

      await careerMissionRepo.updateTask(interviewTask.id, {
        result: {
          ...(interviewTask.result || {}),
          interviewId,
          scheduledAt: interviewTask.scheduledDate,
          calendarEventId: interviewTask.result?.calendarEventId
        }
      });
      
      return {
        interviewId,
        scheduledAt: interviewTask.scheduledDate,
        calendarEventId: interviewTask.result?.calendarEventId,
        totalQuestions: questions.length
      };
    } catch (error: any) {
      console.error('[Step 5] Error:', error.message);
      throw error;
    }
  }
}

export const careerPlanExecutor = new CareerPlanExecutor();
