import { teacher, teachingCovers } from '@/constants';
import { db } from '@/firebase/admin';

interface CareerTeachingSessionInput {
  userId: string;
  missionId: string;
  subject: string;
  topic: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  summary?: string;
  keyPoints?: string[];
  exercises?: string[];
}

export async function createCareerTeachingSession(input: CareerTeachingSessionInput) {
  const coverImage = teachingCovers.length > 0
    ? teachingCovers[Math.floor(Math.random() * teachingCovers.length)]
    : '/teaching/default.png';
  const sessionData = {
    userId: input.userId,
    missionId: input.missionId,
    subject: input.subject,
    topic: input.topic,
    difficulty: input.difficulty || 'Intermediate',
    coverImage,
    completed: false,
    createdAt: new Date().toISOString(),
    summary: input.summary || '',
    keyPoints: input.keyPoints || [],
    exercises: input.exercises || [],
    vapiConfig: {
      ...teacher,
      variableValues: { subject: input.subject, topic: input.topic }
    }
  };

  const docRef = await db.collection('teachingSessions').add(sessionData);
  return { id: docRef.id, ...sessionData };
}