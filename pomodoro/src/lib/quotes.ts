export interface QuoteItem {
  text: string
  author: string
  source?: string
  kind: 'stoic' | 'creative'
}

/**
 * Unlocked one per Quality Block, in this order, and only shown during rests.
 * Each one is a well-documented quotation (common English translations for the Stoics).
 */
export const QUOTES: QuoteItem[] = [
  { kind: 'creative', text: 'Almost everything will work again if you unplug it for a few minutes, including you.', author: 'Anne Lamott' },
  { kind: 'stoic', text: 'We suffer more often in imagination than in reality.', author: 'Seneca', source: 'Letters to Lucilius' },
  { kind: 'creative', text: 'How we spend our days is, of course, how we spend our lives.', author: 'Annie Dillard', source: 'The Writing Life' },
  { kind: 'stoic', text: 'Confine yourself to the present.', author: 'Marcus Aurelius', source: 'Meditations' },
  { kind: 'creative', text: 'Adopt the pace of nature: her secret is patience.', author: 'Ralph Waldo Emerson' },
  { kind: 'stoic', text: 'First say to yourself what you would be; and then do what you have to do.', author: 'Epictetus', source: 'Discourses' },
  { kind: 'creative', text: 'Attention is the beginning of devotion.', author: 'Mary Oliver', source: 'Upstream' },
  { kind: 'stoic', text: 'Begin at once to live, and count each separate day as a separate life.', author: 'Seneca', source: 'Letters to Lucilius' },
  { kind: 'creative', text: 'Be regular and orderly in your life, so that you may be violent and original in your work.', author: 'Gustave Flaubert' },
  { kind: 'stoic', text: 'Waste no more time arguing about what a good man should be. Be one.', author: 'Marcus Aurelius', source: 'Meditations' },
  { kind: 'creative', text: 'You can’t use up creativity. The more you use, the more you have.', author: 'Maya Angelou' },
  { kind: 'stoic', text: 'While we are postponing, life speeds by.', author: 'Seneca', source: 'Letters to Lucilius' },
  { kind: 'creative', text: 'Inspiration is for amateurs. The rest of us just show up and get to work.', author: 'Chuck Close' },
  { kind: 'stoic', text: 'No man is free who is not master of himself.', author: 'Epictetus' },
  { kind: 'creative', text: 'The best way out is always through.', author: 'Robert Frost', source: 'A Servant to Servants' },
  { kind: 'stoic', text: 'The soul becomes dyed with the colour of its thoughts.', author: 'Marcus Aurelius', source: 'Meditations' },
  { kind: 'creative', text: 'Rest is not idleness, and to lie sometimes on the grass under trees on a summer’s day, listening to the murmur of the water, or watching the clouds float across the sky, is by no means a waste of time.', author: 'John Lubbock', source: 'The Use of Life' },
  { kind: 'stoic', text: 'It is not that we have a short time to live, but that we waste a lot of it.', author: 'Seneca', source: 'On the Shortness of Life' },
  { kind: 'creative', text: 'Tell me, what is it you plan to do with your one wild and precious life?', author: 'Mary Oliver', source: 'The Summer Day' },
  { kind: 'creative', text: 'The cure for anything is salt water: sweat, tears or the sea.', author: 'Isak Dinesen' },
  { kind: 'creative', text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Will Durant', source: 'The Story of Philosophy' },
  { kind: 'creative', text: 'Have no fear of perfection. You’ll never reach it.', author: 'Salvador Dalí' },
  { kind: 'stoic', text: 'To be everywhere is to be nowhere.', author: 'Seneca', source: 'Letters to Lucilius' },
]

/** The first quote is a welcome gift; the rest are earned. */
export const INITIAL_UNLOCKED = 1
