import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/mongodb'
import { getCurrentUser } from '@/lib/actions/auth.action'
import { ObjectId } from 'mongodb'

interface Contact {
  _id?: ObjectId
  userId: string
  firstName: string
  lastName: string
  phone?: string
  email?: string
  workEmail?: string
  address?: string
  birthday?: string
  notes?: string
  gradient?: string
  avatar?: string
  createdAt?: Date
  updatedAt?: Date
}

// GET - Fetch all contacts for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDatabase()
    const contacts = await db
      .collection<Contact>('contacts')
      .find({ userId: user.id })
      .sort({ firstName: 1, lastName: 1 })
      .toArray()

    return NextResponse.json({ contacts })
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}

// POST - Create a new contact
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const db = await getDatabase()

    const newContact: Contact = {
      userId: user.id,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone || '',
      email: body.email || '',
      workEmail: body.workEmail || '',
      address: body.address || '',
      birthday: body.birthday || '',
      notes: body.notes || '',
      gradient: body.gradient || 'from-blue-400 to-purple-500',
      avatar: body.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${body.firstName}${body.lastName}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection<Contact>('contacts').insertOne(newContact)

    return NextResponse.json({
      contact: { ...newContact, _id: result.insertedId },
      message: 'Contact created successfully'
    })
  } catch (error) {
    console.error('Error creating contact:', error)
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    )
  }
}
