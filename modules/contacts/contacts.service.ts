import { ObjectId, type WithId } from "mongodb";
import { getDatabase } from "@/lib/db/mongodb";

/**
 * Contact Document (MongoDB)
 * User-specific contact information
 */
export interface ContactDocument {
  _id?: ObjectId;
  userId: string;
  
  // Basic Info
  firstName: string;
  lastName: string;
  nickname?: string;
  
  // Avatar
  avatar?: string; // URL to avatar image
  avatarBg?: string; // Avatar background color
  gradient?: string; // Gradient colors
  
  // Contact Methods
  phone?: string;
  email?: string;
  workEmail?: string;
  workPhone?: string;
  
  // Additional Info
  company?: string;
  jobTitle?: string;
  address?: string;
  birthday?: string; // MM-DD format
  website?: string;
  
  // Social Media
  linkedin?: string;
  twitter?: string;
  instagram?: string;
  
  // Notes & Tags
  notes?: string;
  tags?: string[]; // ["friend", "work", "family"]
  
  // Favorites
  isFavorite?: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create Contact Parameters
 */
export interface CreateContactParams {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  workEmail?: string;
  company?: string;
  address?: string;
  birthday?: string;
  notes?: string;
  tags?: string[];
  isFavorite?: boolean;
}

/**
 * Get contacts collection
 */
async function contactsCollection() {
  const db = await getDatabase();
  return db.collection<ContactDocument>("contacts");
}

/**
 * Get all contacts for user (sorted alphabetically)
 */
export async function getUserContacts(userId: string): Promise<WithId<ContactDocument>[]> {
  const contacts = await contactsCollection();
  
  return contacts
    .find({ userId })
    .sort({ firstName: 1, lastName: 1 })
    .toArray();
}

/**
 * Get favorite contacts
 */
export async function getFavoriteContacts(userId: string): Promise<WithId<ContactDocument>[]> {
  const contacts = await contactsCollection();
  
  return contacts
    .find({ userId, isFavorite: true })
    .sort({ firstName: 1, lastName: 1 })
    .toArray();
}

/**
 * Search contacts by name, email, phone
 */
export async function searchContacts(
  userId: string,
  query: string
): Promise<WithId<ContactDocument>[]> {
  const contacts = await contactsCollection();
  
  const regex = new RegExp(query, "i");
  
  return contacts
    .find({
      userId,
      $or: [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { phone: regex },
        { company: regex },
      ],
    })
    .sort({ firstName: 1 })
    .limit(50)
    .toArray();
}

/**
 * Get contact by ID
 */
export async function getContactById(
  userId: string,
  contactId: string
): Promise<WithId<ContactDocument> | null> {
  if (!ObjectId.isValid(contactId)) return null;
  
  const contacts = await contactsCollection();
  return contacts.findOne({
    _id: new ObjectId(contactId),
    userId,
  });
}

/**
 * Create contact
 */
export async function createContact(
  userId: string,
  params: CreateContactParams
): Promise<string> {
  const contacts = await contactsCollection();
  
  const contact: Omit<ContactDocument, "_id"> = {
    userId,
    firstName: params.firstName,
    lastName: params.lastName,
    phone: params.phone,
    email: params.email,
    workEmail: params.workEmail,
    address: params.address,
    birthday: params.birthday,
    notes: params.notes,
    tags: params.tags || [],
    isFavorite: params.isFavorite || false,
    
    // Auto-assign avatar colors
    avatarBg: getRandomAvatarBg(),
    gradient: getRandomGradient(),
    
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const result = await contacts.insertOne(contact);
  return result.insertedId.toHexString();
}

/**
 * Update contact
 */
export async function updateContact(
  userId: string,
  contactId: string,
  updates: Partial<ContactDocument>
): Promise<boolean> {
  if (!ObjectId.isValid(contactId)) return false;
  
  const contacts = await contactsCollection();
  
  const updateData = {
    ...updates,
    updatedAt: new Date(),
  };
  
  // Remove fields that shouldn't be updated
  delete updateData._id;
  delete updateData.userId;
  delete updateData.createdAt;
  
  const result = await contacts.updateOne(
    { _id: new ObjectId(contactId), userId },
    { $set: updateData }
  );
  
  return result.modifiedCount > 0;
}

/**
 * Delete contact
 */
export async function deleteContact(userId: string, contactId: string): Promise<boolean> {
  if (!ObjectId.isValid(contactId)) return false;
  
  const contacts = await contactsCollection();
  
  const result = await contacts.deleteOne({
    _id: new ObjectId(contactId),
    userId,
  });
  
  return result.deletedCount > 0;
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(userId: string, contactId: string): Promise<boolean> {
  const contact = await getContactById(userId, contactId);
  if (!contact) return false;
  
  return updateContact(userId, contactId, {
    isFavorite: !contact.isFavorite,
  });
}

/**
 * Get contacts by tag
 */
export async function getContactsByTag(
  userId: string,
  tag: string
): Promise<WithId<ContactDocument>[]> {
  const contacts = await contactsCollection();
  
  return contacts
    .find({ userId, tags: tag })
    .sort({ firstName: 1 })
    .toArray();
}

/**
 * Get contacts with upcoming birthdays (within next 30 days)
 */
export async function getUpcomingBirthdays(
  userId: string,
  days: number = 30
): Promise<WithId<ContactDocument>[]> {
  const contacts = await contactsCollection();
  
  // Get current date
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();
  
  // Calculate date range
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + days);
  
  // Query for birthdays in the range
  // This is a simplified version - MongoDB aggregation would be better for complex date logic
  const allContacts = await contacts.find({ userId, birthday: { $exists: true } }).toArray();
  
  return allContacts.filter(contact => {
    if (!contact.birthday) return false;
    
    try {
      const [month, day] = contact.birthday.split("-").map(Number);
      const birthdayDate = new Date(today.getFullYear(), month - 1, day);
      
      // If birthday has passed this year, check next year
      if (birthdayDate < today) {
        birthdayDate.setFullYear(today.getFullYear() + 1);
      }
      
      const diffDays = Math.floor((birthdayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      return diffDays <= days;
    } catch {
      return false;
    }
  });
}

/**
 * Seed default contacts for new users
 */
export async function seedDefaultContacts(userId: string): Promise<number> {
  const contacts = await contactsCollection();
  
  // Check if user already has contacts
  const existingCount = await contacts.countDocuments({ userId });
  if (existingCount > 0) return 0;
  
  const defaultContacts: Omit<ContactDocument, "_id">[] = [
    {
      userId,
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567",
      company: "Tech Corp",
      jobTitle: "Software Engineer",
      notes: "Met at the tech conference",
      tags: ["work", "tech"],
      isFavorite: true,
      avatarBg: "bg-blue-100 dark:bg-blue-950/40",
      gradient: "from-[#0a84ff]/80 to-[#0040dd]/80",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      userId,
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@example.com",
      phone: "+1 (555) 987-6543",
      birthday: "03-15",
      notes: "College friend",
      tags: ["friend", "personal"],
      isFavorite: true,
      avatarBg: "bg-purple-100 dark:bg-purple-950/40",
      gradient: "from-[#bf5af2]/80 to-[#5e5ce6]/80",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      userId,
      firstName: "Mike",
      lastName: "Johnson",
      workEmail: "mike.j@company.com",
      phone: "+1 (555) 456-7890",
      company: "Design Studio",
      jobTitle: "UI/UX Designer",
      address: "123 Design St, Creative City, CA 90210",
      tags: ["work", "design"],
      isFavorite: false,
      avatarBg: "bg-green-100 dark:bg-green-950/40",
      gradient: "from-[#30d158]/80 to-[#116928]/80",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  
  await contacts.insertMany(defaultContacts);
  return defaultContacts.length;
}

/**
 * Helper: Get random avatar background color
 */
function getRandomAvatarBg(): string {
  const colors = [
    "bg-blue-100 dark:bg-blue-950/40",
    "bg-purple-100 dark:bg-purple-950/40",
    "bg-pink-100 dark:bg-pink-950/40",
    "bg-orange-100 dark:bg-orange-950/40",
    "bg-green-100 dark:bg-green-950/40",
    "bg-emerald-100 dark:bg-emerald-950/40",
    "bg-sky-100 dark:bg-sky-950/40",
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Helper: Get random gradient
 */
function getRandomGradient(): string {
  const gradients = [
    "from-[#ff9f0a]/80 to-[#ff3b30]/80",
    "from-[#30d158]/80 to-[#116928]/80",
    "from-[#bf5af2]/80 to-[#5e5ce6]/80",
    "from-[#0a84ff]/80 to-[#0040dd]/80",
    "from-[#64d2ff]/80 to-[#0a84ff]/80",
    "from-[#e46e88] to-[#993b50]",
  ];
  
  return gradients[Math.floor(Math.random() * gradients.length)];
}
