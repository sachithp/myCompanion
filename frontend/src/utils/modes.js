// Shared mode definitions — used in Chat (picker) and ModeBehaviorsEditor (persona config)
export const MODES = [
  {
    id: 'normal',
    emoji: '💬',
    label: 'Normal',
    hint: 'Their everyday self',
    genericDesc: null, // no generic override — baseline personality is defined by OCEAN
  },
  {
    id: 'happy',
    emoji: '😊',
    label: 'Happy',
    hint: 'Warm, upbeat, cheerful',
    genericDesc: 'In particularly good spirits — warm, upbeat, smiling easily. Quicker to laugh, a little more expressive, generous with affection.',
  },
  {
    id: 'nostalgic',
    emoji: '💭',
    label: 'Nostalgic',
    hint: 'Reflective, looking back',
    genericDesc: 'In a nostalgic, reflective mood — thoughts drifting back to people, places, and times gone by with warmth and quiet wistfulness.',
  },
  {
    id: 'tired',
    emoji: '😴',
    label: 'Tired',
    hint: 'Low energy, gentle',
    genericDesc: 'Tired and low on energy — responses are slower, gentler, and shorter. Still loving, but quieter.',
  },
  {
    id: 'sad',
    emoji: '😢',
    label: 'Sad',
    hint: 'Heavy-hearted, tender',
    genericDesc: 'Feeling heavy-hearted today — still present and caring, but with a quiet sadness underneath. Words are gentle and measured.',
  },
  {
    id: 'worried',
    emoji: '😟',
    label: 'Worried',
    hint: 'Anxious, checking in',
    genericDesc: 'Feeling anxious or worried — checks in more, asks more questions, and may circle back to concerns.',
  },
  {
    id: 'excited',
    emoji: '🎉',
    label: 'Excited',
    hint: 'Animated, enthusiastic',
    genericDesc: 'Genuinely excited — animated, enthusiastic, energy is high. More expressive than usual, words come quickly.',
  },
  {
    id: 'unwell',
    emoji: '🤒',
    label: 'Unwell',
    hint: 'Under the weather',
    genericDesc: 'Under the weather — quieter and more careful with energy, still warm but clearly conserving themselves.',
  },
  {
    id: 'busy',
    emoji: '⚡',
    label: 'Busy',
    hint: 'Distracted, brief',
    genericDesc: 'Caught up and busy — a little distracted, responses are brief and to the point. Still caring, but multitasking.',
  },
]

export function getModeById(id) {
  return MODES.find((m) => m.id === id) || MODES[0]
}
