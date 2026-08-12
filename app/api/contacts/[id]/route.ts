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
  updatedAt?: Date
}

// PUT - Update a contact
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contactId = params.id
    if (!ObjectId.isValid(contactId)) {
      return NextResponse.json({ error: 'Invalid contact ID' }, { status: 400 })
    }

    const body = await request.json()
    const db = await getDatabase()

    // Verify ownership
    const existingContact = await db.collection<Contact>('contacts').findOne({
      _id: new ObjectId(contactId),
      userId: user.id
    })

    if (!existingContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    const updateData = {
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
      updatedAt: new Date()
    }

    await db.collection<Contact>('contacts').updateOne(
      { _id: new ObjectId(contactId) },
      { $set: updateData }
    )

    return NextResponse.json({
      message: 'Contact updated successfully',
      contact: { ...updateData, _id: contactId, userId: user.id }
    })
  } catch (error) {
    console.error('Error updating contact:', error)
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contactId = params.id
    if (!ObjectId.isValid(contactId)) {
      return NextResponse.json({ error: 'Invalid contact ID' }, { status: 400 })
    }

    const db = await getDatabase()

    const result = await db.collection('contacts').deleteOne({
      _id: new ObjectId(contactId),
      userId: user.id
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Contact deleted successfully' })
  } catch (error) {
    console.error('Error deleting contact:', error)
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    )
  }
}
