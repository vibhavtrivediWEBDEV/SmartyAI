import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth/session';
import { findNotesByUserId } from '@/modules/career/career-plan.repository';

export async function GET() {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const notes = await findNotesByUserId(userId);

  return NextResponse.json({
    notes: notes.map((note) => ({
      id: note._id.toHexString(),
      subject: note.title,
      message: note.content,
      createdAt: note.createdAt,
      color: '#38BDF8',
      source: note.source,
      missionId: note.missionId
    }))
  });
}