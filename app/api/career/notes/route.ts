import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth/session';
import { findNotesByUserId } from '@/modules/career/career-plan.repository';

function parseDate(value: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function GET(request: Request) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const notes = await findNotesByUserId(userId, {
    start: parseDate(params.get('start')),
    end: parseDate(params.get('end')),
    query: params.get('query') || undefined,
    limit: Number(params.get('limit')) || undefined,
  });

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