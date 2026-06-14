import { TeraMode } from '@/types/domain';

export const modeOptions: Array<{ label: string; value: TeraMode }> = [
  { label: 'Learn', value: 'learn' },
  { label: 'Research', value: 'research' },
  { label: 'Build', value: 'build' },
];

export const starterPrompts: Record<TeraMode, string[]> = {
  learn: [
    'Explain transformers with a simple analogy.',
    'Teach me calculus limits step by step.',
    'Quiz me on photosynthesis after explaining it.',
  ],
  research: [
    'Build a research plan for renewable energy storage.',
    'Compare three views on remote learning outcomes.',
    'Turn this topic into source questions.',
  ],
  build: [
    'Help me turn my notes into a study app.',
    'Design a project plan for learning Python.',
    'Create a launch checklist for a learning product.',
  ],
};

export function formatRelativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
