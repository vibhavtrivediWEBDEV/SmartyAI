export const SOUND_REACTION_EVENT = 'smarty:sound-reaction';

export interface SoundReactionDetail {
  soundId: string;
  emoji: string;
  label: string;
  color: string;
}