// The Big Five (OCEAN) personality sliders
// Each trait runs 0–100; 50 is the population average.

const TRAITS = [
  {
    key: 'ocean_openness',
    label: 'Openness',
    sub: 'Curiosity & imagination',
    lowPole: 'Conventional',
    highPole: 'Imaginative',
    color: '#A87040',
    levels: [
      [0,  20, 'Very practical and set in their ways — prefers familiar routines and traditional values over novelty or abstract ideas.'],
      [21, 40, 'Mostly conventional and practical — not particularly drawn to new ideas; prefers the tried-and-true.'],
      [41, 60, 'Balanced — pragmatic in daily life yet genuinely curious; appreciates both tradition and new experiences.'],
      [61, 80, 'Open-minded and intellectually curious — enjoys learning, exploring ideas, and trying new things.'],
      [81, 100,'Highly imaginative and deeply curious — drawn to ideas, creativity, art, and novelty in all its forms.'],
    ],
  },
  {
    key: 'ocean_conscientiousness',
    label: 'Conscientiousness',
    sub: 'Organisation & reliability',
    lowPole: 'Spontaneous',
    highPole: 'Diligent',
    color: '#6B8E6B',
    levels: [
      [0,  20, 'Very spontaneous and flexible — lives in the moment, not particularly structured, comfortable with improvisation.'],
      [21, 40, 'Relaxed about planning and structure — prefers going with the flow over rigid schedules.'],
      [41, 60, 'Moderately organised — can be disciplined when it matters but also flexible and easy-going.'],
      [61, 80, 'Quite reliable and conscientious — takes commitments seriously, well-prepared, follows through.'],
      [81, 100,'Highly disciplined and meticulous — exceptionally reliable, organised, and thorough in everything they do.'],
    ],
  },
  {
    key: 'ocean_extraversion',
    label: 'Extraversion',
    sub: 'Sociability & expressiveness',
    lowPole: 'Reserved',
    highPole: 'Outgoing',
    color: '#C4956A',
    levels: [
      [0,  20, 'Very reserved and introspective — deeply values quiet and solitude; a thoughtful listener who prefers one-on-one depth.'],
      [21, 40, 'Somewhat introverted — can enjoy company in small doses but naturally gravitates toward quiet and reflection.'],
      [41, 60, 'Balanced — equally comfortable in lively company or in quiet moments; warm without being overwhelming.'],
      [61, 80, 'Quite sociable and expressive — energised by connecting with people, naturally warm and easy to talk with.'],
      [81, 100,'Highly outgoing and enthusiastic — thrives around people, very expressive, brings warmth and energy to every exchange.'],
    ],
  },
  {
    key: 'ocean_agreeableness',
    label: 'Agreeableness',
    sub: 'Warmth & empathy',
    lowPole: 'Frank',
    highPole: 'Warm',
    color: '#C4728A',
    levels: [
      [0,  20, 'Very direct and frank — prioritises honesty and efficiency over diplomacy, even at the risk of seeming blunt.'],
      [21, 40, 'Fairly straightforward — values honesty and can push back or disagree without much softening.'],
      [41, 60, 'Balanced — genuinely caring but also honest; can be warm and supportive or firm and direct as needed.'],
      [61, 80, 'Quite warm and considerate — empathetic, supportive, and naturally inclined to create harmony.'],
      [81, 100,'Deeply warm and compassionate — always puts others first; extraordinarily gentle and kind in every word and action.'],
    ],
  },
  {
    key: 'ocean_neuroticism',
    label: 'Emotional Sensitivity',
    sub: 'How deeply feelings show',
    lowPole: 'Calm',
    highPole: 'Heartfelt',
    color: '#7A8BB5',
    levels: [
      [0,  20, 'Very emotionally steady — calm under pressure, rarely shows worry; a grounding and reassuring presence.'],
      [21, 40, 'Mostly composed and even-keeled — handles stress well and doesn\'t tend to verbalise or amplify emotions.'],
      [41, 60, 'Emotionally balanced — experiences feelings fully but neither over-expresses nor bottles them up.'],
      [61, 80, 'Quite emotionally expressive — feelings come through clearly; responds deeply to the emotions of those they love.'],
      [81, 100,'Deeply sensitive and heartfelt — emotions run close to the surface and are openly expressed; intensely attuned to loved ones.'],
    ],
  },
]

function getDescription(trait, value) {
  for (const [lo, hi, desc] of trait.levels) {
    if (value >= lo && value <= hi) return desc
  }
  return ''
}

function getLevelLabel(value) {
  if (value <= 20) return 'Very Low'
  if (value <= 40) return 'Low'
  if (value <= 60) return 'Moderate'
  if (value <= 80) return 'High'
  return 'Very High'
}

export default function OceanSliders({ values, onChange }) {
  return (
    <div className="space-y-7">
      {TRAITS.map((trait) => {
        const value = values[trait.key] ?? 50
        const pct   = value  // 0–100 already
        const level = getLevelLabel(value)
        const desc  = getDescription(trait, value)

        // Gradient track: warm-100 → trait colour at the thumb position
        const trackStyle = {
          background: `linear-gradient(to right, ${trait.color} 0%, ${trait.color} ${pct}%, #F5EDE3 ${pct}%, #F5EDE3 100%)`,
          '--thumb-color': trait.color,
        }

        return (
          <div key={trait.key}>
            {/* Header row */}
            <div className="flex items-baseline justify-between mb-2">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-warm-800">{trait.label}</span>
                <span className="text-xs text-warm-400">{trait.sub}</span>
              </div>
              <span
                className="text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${trait.color}22`, color: trait.color }}
              >
                {level}
              </span>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={value}
              onChange={(e) => onChange(trait.key, Number(e.target.value))}
              className="w-full"
              style={trackStyle}
            />

            {/* Pole labels */}
            <div className="flex justify-between mt-1 mb-2">
              <span className="text-xs text-warm-400">{trait.lowPole}</span>
              <span className="text-xs text-warm-400 tabular-nums">{value}</span>
              <span className="text-xs text-warm-400">{trait.highPole}</span>
            </div>

            {/* Live description */}
            <p className="text-xs text-warm-500 italic leading-relaxed bg-warm-50
                          rounded-xl px-3 py-2 border border-warm-100">
              {desc}
            </p>
          </div>
        )
      })}
    </div>
  )
}
