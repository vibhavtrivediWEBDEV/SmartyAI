#!/usr/bin/env node
/**
 * Test Calendar Event Parsing
 * 
 * Tests various natural language inputs to ensure proper extraction of:
 * - Title
 * - Date (today, tomorrow, specific dates)
 * - Time (various formats)
 * - Location
 * - Notes
 */

const testCases = [
  {
    input: "calendar add event tomorrow for the bday party",
    expected: {
      title: "bday party",
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time: "09:00",
      location: "",
      notes: ""
    }
  },
  {
    input: "calendar add event today team meeting at 2pm",
    expected: {
      title: "team meeting",
      date: new Date().toISOString().split('T')[0],
      time: "14:00",
      location: "",
      notes: ""
    }
  },
  {
    input: "calendar add event tomorrow lunch at 12:30",
    expected: {
      title: "lunch",
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time: "12:30",
      location: "",
      notes: ""
    }
  },
  {
    input: "calendar add event doctor appointment tomorrow at 3pm location clinic with bring insurance card",
    expected: {
      title: "doctor appointment",
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time: "15:00",
      location: "clinic",
      notes: "bring insurance card"
    }
  },
  {
    input: "calendar add event today standup at 9am",
    expected: {
      title: "standup",
      date: new Date().toISOString().split('T')[0],
      time: "09:00",
      location: "",
      notes: ""
    }
  },
  {
    input: "calendar add event project review tomorrow at 2pm notes need to prepare slides",
    expected: {
      title: "project review",
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time: "14:00",
      location: "",
      notes: "need to prepare slides"
    }
  },
  {
    input: "calendar add event birthday party tomorrow",
    expected: {
      title: "birthday party",
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time: "09:00",
      location: "",
      notes: ""
    }
  },
  {
    input: "calendar add event client call today at 11:30",
    expected: {
      title: "client call",
      date: new Date().toISOString().split('T')[0],
      time: "11:30",
      location: "",
      notes: ""
    }
  }
];

console.log("🧪 Testing Calendar Event Parsing\n");
console.log("=".repeat(80));

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. Input: "${testCase.input}"`);
  console.log("-".repeat(80));
  
  const lower = testCase.input.toLowerCase();
  const input = testCase.input;
  
  // Simulate the parsing logic
  let titleText = input;
  titleText = titleText.replace(/(?:calendar\s+)?(?:add|create|new)\s+event\s+(?:for\s+)?/i, '');
  titleText = titleText.replace(/add\s+event\s+to\s+calendar\s+(?:for\s+)?/i, '');
  
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
  const timeMatch = lower.match(/(?:at\s+)?(\d{1,2}):(\d{2})\s*(am|pm)?|(?:at\s+)?(\d{1,2})\s*(am|pm)/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1] || timeMatch[4]);
    const mins = timeMatch[2] || '00';
    const meridiem = (timeMatch[3] || timeMatch[5] || '').toLowerCase();
    
    if (meridiem === 'pm' && hours < 12) {
      hours += 12;
    } else if (meridiem === 'am' && hours === 12) {
      hours = 0;
    }
    
    time = `${hours.toString().padStart(2, '0')}:${mins}`;
    titleText = titleText.replace(timeMatch[0], '');
  }
  
  // Remove date words
  titleText = titleText.replace(/\s*(today|tomorrow)\s*/gi, ' ').trim();
  
  // Extract location - look for 'location [place]' (must be explicit)
  let location = '';
  const locationMatch = lower.match(/(?:location|place)\s+(.+?)(?=\s+(?:notes|description|with|$))/i);
  if (locationMatch) {
    location = locationMatch[1].trim();
    titleText = titleText.replace(locationMatch[0], '');
  }
  
  // Extract notes - look for 'with [notes]' or 'notes [description]'
  let notes = '';
  const notesMatch = lower.match(/(?:with|notes?|description|about)\s+(.+?)$/i);
  if (notesMatch) {
    notes = notesMatch[1].trim();
    titleText = titleText.replace(notesMatch[0], '');
  }
  
  // Clean up title
  titleText = titleText.replace(/\s+/g, ' ').trim();
  // Remove "for the" pattern first
  titleText = titleText.replace(/\s*for\s+the\s+/gi, ' ');
  // Then remove leading/trailing filler words
  titleText = titleText.replace(/^(for|at|on|in|the)\s+/i, '');
  titleText = titleText.replace(/\s+(for|at|on|in)$/i, '');
  titleText = titleText.trim();
  
  let title = titleText || 'New Event';
  if (!title || title.length < 2 || /^(?:for|at|on|today|tomorrow)$/i.test(title)) {
    title = 'New Event';
  }
  
  // Display results
  console.log(`  Title:    "${title}" ${title === testCase.expected.title ? '✅' : '❌ (expected: "' + testCase.expected.title + '")'}`);
  console.log(`  Date:     "${date}" ${date === testCase.expected.date ? '✅' : '❌ (expected: "' + testCase.expected.date + '")'}`);
  console.log(`  Time:     "${time}" ${time === testCase.expected.time ? '✅' : '❌ (expected: "' + testCase.expected.time + '")'}`);
  console.log(`  Location: "${location}" ${location === testCase.expected.location ? '✅' : '❌ (expected: "' + testCase.expected.location + '")'}`);
  console.log(`  Notes:    "${notes}" ${notes === testCase.expected.notes ? '✅' : '❌ (expected: "' + testCase.expected.notes + '")'}`);
});

console.log("\n" + "=".repeat(80));
console.log("✅ Test complete\n");
