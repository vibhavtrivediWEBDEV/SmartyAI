// Test calendar title extraction

const testCases = [
  'calendar add event for today friends bday',
  'calendar add event meeting tomorrow',
  'calendar add event lunch today at 2pm',
  'calendar add event project deadline',
];

console.log('\n🧪 Testing Title Extraction Logic\n');
console.log('='.repeat(60));

testCases.forEach(input => {
  console.log(`\nInput: "${input}"`);
  
  // Extract title
  let title = 'New Event';
  const lower = input.toLowerCase();
  
  // Try to extract title after 'event'
  const afterEvent = lower.match(/(?:add|create|new)\s+event\s+(?:for\s+)?(?:today\s+|tomorrow\s+)?(?:for\s+)?(.+)$/);
  
  if (afterEvent && afterEvent[1].trim()) {
    title = afterEvent[1].trim();
    
    // Remove known date/time patterns
    // Remove 'today' or 'tomorrow'
    title = title.replace(/\s*(today|tomorrow)\s*/gi, ' ').trim();
    
    // Remove 'at 2pm' or 'at 14:00'
    title = title.replace(/\s*at\s+\d{1,2}(:\d{2})?\s*(am|pm)?\s*/gi, '').trim();
    
    // Remove 'on 2024-01-01'
    title = title.replace(/\s*on\s+\d{4}[-/]\d{1,2}[-/]\d{1,2}\s*/gi, '').trim();
    
    // Remove 'notes ...'
    title = title.replace(/\s*notes?\s+.+$/i, '').trim();
    
    // If title is too short or just keywords, use generic
    if (title.length < 2 || /^(?:for|at|on|today|tomorrow)$/i.test(title)) {
      title = 'New Event';
    }
  }
  
  // Ensure title is not empty
  if (!title || title.length === 0) {
    title = 'New Event';
  }
  
  // Extract date
  let date = new Date().toISOString().split('T')[0];
  if (lower.includes('today')) {
    date = new Date().toISOString().split('T')[0];
  } else if (lower.includes('tomorrow')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    date = tomorrow.toISOString().split('T')[0];
  }
  
  // Extract time
  let time = '09:00';
  const timeMatch = lower.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (timeMatch) {
    time = timeMatch[0].replace(/\s/g, '');
  }
  
  console.log(`Title: "${title}"`);
  console.log(`Date: "${date}"`);
  console.log(`Time: "${time}"`);
  console.log(`CalendarId: "personal"`);
});

console.log('\n' + '='.repeat(60));
console.log('✅ Test complete!\n');
