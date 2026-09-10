import { teacher, teachingCovers } from '@/constants';
import { db } from '@/firebase/admin';

interface CareerTeachingSessionInput {
  userId: string;
  missionId: string;
  careerTaskId?: string;
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
    ...(input.careerTaskId ? { careerTaskId: input.careerTaskId } : {}),
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

export async function deleteCareerTeachingSessions(missionId: string): Promise<number> {
  const snapshot = await db.collection('teachingSessions').where('missionId', '==', missionId).get();
  if (snapshot.empty) return 0;

  for (let index = 0; index < snapshot.docs.length; index += 450) {
    const batch = db.batch();
    snapshot.docs.slice(index, index + 450).forEach((document) => batch.delete(document.ref));
    await batch.commit();
  }

  return snapshot.size;
}