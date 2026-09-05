const SCHEDULE_PREFIX = /^(?:(?:day|week|module|lesson)\s*\d+|\d+)\s*[-:|]\s*/i;
const GENERIC_TOPIC_WORDS = new Set([
  'and',
  'basics',
  'beginner',
  'beginners',
  'core',
  'fundamental',
  'fundamentals',
  'introduction',
  'the',
]);

export function extractLearningTopic(title: string): string {
  return title.trim().replace(SCHEDULE_PREFIX, '').trim();
}

export function buildLearningVideoQuery(title: string): string {
  const topic = extractLearningTopic(title);
  return `${topic} tutorial for beginners`;
}

export function isVideoTitleRelevant(topic: string, videoTitle: string): boolean {
  const topicWords = extractLearningTopic(topic)
    .toLowerCase()
    .match(/[a-z0-9+#.]+/g)
    ?.filter((word) => word.length > 2 && !GENERIC_TOPIC_WORDS.has(word)) ?? [];

  if (!topicWords.length) return true;
  const normalizedTitle = videoTitle.toLowerCase();
  return topicWords.some((word) => normalizedTitle.includes(word));
}