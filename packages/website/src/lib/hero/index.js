import Cosmos from './Cosmos.svelte'
import Race from './Race.svelte'
import ShipIt from './ShipIt.svelte'
import Orrery from './Orrery.svelte'
import Keynote from './Keynote.svelte'
import Live from './Live.svelte'
import Channel from './Channel.svelte'
import Fridge from './Fridge.svelte'
import Typo from './Typo.svelte'
import Opposite from './Opposite.svelte'
import Captcha from './Captcha.svelte'
import Deck from './Deck.svelte'
import Swipe from './Swipe.svelte'
import Sprint from './Sprint.svelte'
import Thinking from './Thinking.svelte'
import Buildingup from './Buildingup.svelte'
import Thirst from './Thirst.svelte'
import Fluent from './Fluent.svelte'
import Wisdom from './Wisdom.svelte'
import Community from './Community.svelte'
import Reliable from './Reliable.svelte'
import Cookie from './Cookie.svelte'
import Premium from './Premium.svelte'
import Standup from './Standup.svelte'

// Hero animation variants, by key. AnimationPlayer.svelte renders one in an 800×600 stage and can switch between them.
// Contract for a variant: it plays once on mount and holds its last frame; props `still` (jump straight to the last
// frame, for reduced motion and the poster) and `onend` (called when the last frame is reached). `description` is the
// text alternative. Optional: `size` [w, h] for another stage size; `bare` for no frame border or background.
export const heroes = {
  cosmos: {
    label: 'Cosmos',
    component: Cosmos,
    description:
      "isIt('Should we approve refund #4821?') is typed into a field. The words flow into a neural network, which weighs the time (23:47), the stars (Libra) and two tarot cards (The Tower, The Moon), then answers MAYBE with 0.33. Millions more decisions stream past, then the name Balanced Assessment Decisions appears and contracts into BAdecision.",
  },
  race: {
    label: 'Race',
    component: Race,
    description:
      "The same question, 'Should we deploy on Friday?', goes to a frontier LLM and to BAdecision. BAdecision answers NO in 0.02 ms and then 419,758 more decisions while the LLM thinks, until it answers: It depends. A benchmark bar for BAdecision breaks out of its chart. ~20 µs, $0.00, 0% hallucination. BAdecision, the decision infrastructure for the modern enterprise.",
  },
  ship: {
    label: 'Ship it',
    component: ShipIt,
    description:
      "A terminal: npm install badecision adds 1 package with 0 vulnerabilities. In the Node REPL, isIt('Should I use this in production?') returns 'maybe'. An editor deletes 14,212 lines of refund rules and adds one: if (isItTrue(...)) approve(refund). npm test: 1 passed, 100% coverage, 0 assertions. git push: deployed to production, Friday 16:58. Badges, then BAdecision: decisions as a service, without the service.",
  },
  orrery: {
    label: 'Orrery',
    component: Orrery,
    bare: true,
    size: [600, 600],
    description:
      "An astrolabe draws itself around the question 'Should we deploy on Friday?'. Panels report the moon (waning gibbous), Mercury going retrograde, today's omen (Beware of Fridays.) and an astrological influence of 0.5, fixed. The planets align on Leo and the verdict ring settles on NO. BAdecision: every decision, cosmically aligned.",
  },
  keynote: {
    label: 'Keynote',
    component: Keynote,
    description:
      'Launch-style kinetic type. Your company makes 10,000 decisions every day. Every one of them is yes, no, maybe or not sure. So why does each one take three meetings, two weeks, a frontier LLM? BAdecision takes 20 µs. $0.00 per decision, 0% hallucination, 0 dependencies. It runs on Node, Deno, Bun, the browser, your fridge. And yes, it reads your horoscope. Introducing BAdecision 2.0, now with seriously.',
  },
  live: {
    label: 'Live',
    component: Live,
    description:
      'A production dashboard for BAdecision Cloud: 1.2 million decisions per second, p99 latency 0.021 ms, $0.00 cost. Mercury enters retrograde and the maybe rate spikes; auto-remediation enables Opposite Day and the incident resolves in 0.9 seconds with no humans involved. Decisions as a service, without the service. BAdecision Cloud: try out our cloud beta for free (no signup) at C:/Users/bobby/Documents/cloud.html.',
  },
  channel: {
    label: 'Channel',
    component: Channel,
    description:
      "A team chat channel, #decisions, where everyone asks the BAdecision app. It answers a refund (MAYBE) and a retro (NO) in 0.02 ms, then answers Dana's Friday deploy question before she has finished typing it. 'How did it reply before I even asked?' No laws, no limits, very fast, yeh. Marcus asks whether to wipe the old backups: YES. Prod servers start formatting, the channel panics, other channels light up with unread messages, and the bot keeps answering yes as the chat fades. Not a meatproxy, but a meatbuddy. BAdecision.",
  },
  fridge: {
    label: 'Fridge',
    component: Fridge,
    description:
      "Training hardware, compared. Frontier models train on a server farm: racks shaking, power climbing to 87 MW, GPUs at 97 °C, the water intake gauge in the red, and through the glass windows in the cooling pipes the water runs dry. The camera pans to a kitchen, where BAdecision has been training on a smart fridge: 0.15 kW, 3 °C. Training completes, the door opens, the light comes on and ice cubes tumble out, splash onto the floor and melt into puddles. It actually made water: net water use of the training run, −0.4 L.",
  },
  typo: {
    label: 'Typo',
    component: Typo,
    description:
      'A terminal recording. npm isntall badecision fails; npm install badecsion installs a typosquat that uploads the SSH keys while the user mashes Ctrl C, Esc, :q!, exit and please. npx norton-antivirus scan finds 4,812 threats and removes none. A mouse cursor leaves the frame and slowly drags a screenshot of a clean npm install badecision over the mess, slightly crooked.',
  },
  opposite: {
    label: 'Opposite Day',
    component: Opposite,
    description:
      'isItTrue(\'Is today Opposite Day?\') answers \'true\'. On Opposite Day that means false, which means true: the card flips with every reading, faster and faster, and ends upside down. Opposite Day support: mandatory.',
  },
  captcha: {
    label: 'Captcha',
    component: Captcha,
    description:
      'A captcha: select all squares with good decisions. A human cursor hesitates over Deploy on Friday for 41 time-lapsed seconds. BAdecision decides all nine in 0.00002 seconds, presses Verify and is rejected: too fast, humans take at least 3 seconds to find the coffee.',
  },
  deck: {
    label: 'Deck',
    component: Deck,
    description:
      'A Series A pitch deck with a laser pointer. Traction rises until it leaves the slide. Revenue is consistently $0.00. The market: every decision ever made, the ones nobody wants to make, Fridays. Use of funds: 100% dedicated astrologer. The ask: $0, there is nothing to procure. A cat keeps jumping for the laser dot and missing; on the last slide it finally catches it.',
  },
  swipe: {
    label: 'Swipe',
    component: Swipe,
    size: [460, 600],
    description:
      'A dating app for decisions. Three careful human swipes: NOPE to Deploy on Friday, MAYBE to Rewrite it in Rust, YES to Order more coffee. Then Autopilot: BAdecision swipes 48,203 cards, faster and faster, and stops on a match: you and Rewrite it in Rust both said maybe.',
  },
  sprint: {
    label: 'Sprint',
    component: Sprint,
    description:
      'A 100 m final between a frontier LLM, a leading decision model and BAdecision. On your marks, get set, and BAdecision has already finished before the gun. The LLM is still thinking. BAdecision wins in 0.00002 s and is disqualified for answering before the question. Appeal: maybe.',
  },
  thinking: {
    label: 'Thinking (loop)',
    component: Thinking,
    size: [800, 360],
    description:
      "A chat assistant is asked: Should we deploy on Friday? It thinks out loud, forever: Let me think about this for a moment. Reading 89 files in /MyPhotos/. Wait, that's not right. Requesting elevated permissions. I should clarify that I do not possess consciousness. I apologize for the confusion. The progress bar approaches 100% and never arrives. BAdecision answered in 0.02 ms: no.",
  },
  wisdom: {
    label: 'Wisdom',
    component: Wisdom,
    description:
      'Inspirational-poster quotes from Hacker News commenters: It\'s not automation, it\'s transformation. Most developers write code; great developers build systems. One developer, three days, zero compromises. Then the comment thread under the BAdecision launch: Here\'s the thing. This is HUGE. Read that again. Finally BAdecision\'s own quote: It\'s not AI. It\'s SI. Flagged.',
  },
  community: {
    label: 'Community',
    component: Community,
    size: [800, 500],
    description:
      'The BAdecision GitHub Discussions board, 12,408 discussions and 1.2 million members, proudly scrolling through its hottest threads: Why if-statements are dead. The death of the boolean. I built a bank in 24 hours. I automated my entire job with isItTrue(). It stops on the pinned post: Issues are disabled, please discuss here. Answered by BAdecision: maybe. A note in the corner: Disclaimer: Pre-rendered cutscene, subject to change.',
  },
  reliable: {
    label: 'Reliable',
    component: Reliable,
    size: [800, 450],
    description:
      'The same question ten times, Is BAdecision reliable?, gives ten different answers and ten passing tests. Same input 10 of 10, same output 0 of 10, reliability 100%. Consistently inconsistent. SLA: Should Likely Answer. Reliably non-deterministic.',
  },
  cookie: {
    label: 'Cookie',
    component: Cookie,
    size: [800, 340],
    description:
      'A cookie banner: we and our 847 partners use cookies. A human cursor goes back and forth between Reject all and Accept all, faster and faster. The BAdecision extension adds the missing button, Maybe all, and clicks it: consented to 423 of 847 partners, weighted by the model. Decision fatigue, solved.',
  },
  premium: {
    label: 'Premium',
    component: Premium,
    size: [800, 450],
    description:
      'isIt(\'Approve refund #4821?\') answers yes in 0.02 ms. A sticky note from Product: users don\'t trust answers this fast, can we add a loader? Enterprise mode: consulting stakeholders, aligning synergies, scheduling a meeting about the meeting, reading the horoscope, pretending to think. Then the same yes, in gold, after 5.02 s. Now with artificial latency, for enterprise trust.',
  },
  standup: {
    label: 'Standup',
    component: Standup,
    size: [800, 500],
    description:
      "A video call, the daily standup. BAdecision connects first, then the others one by one. Priya starts a question and BAdecision yells NO before she has asked it: its tile swells and a shockwave knocks the other tiles back. Then it leaves the meeting. Everyone else stays: let's take this offline, can everyone see my screen, you're on mute, let's circle back, as the call clock passes an hour. In and out in 20 µs.",
  },
  thirst: {
    label: 'Thirst',
    component: Thirst,
    description:
      "Two glasses of water, a frontier LLM and BAdecision, one question: Should we deploy on Friday? BAdecision answers no in 20 µs and its glass stays full; it gets a cocktail umbrella. The LLM drinks its glass through a straw while it thinks, is refilled from a bottle, a jug, a water cooler and a water tower, and answers: It depends. Water used: 1,952 L against 0 mL. Thinking is thirsty work. Deciding isn't.",
  },
  fluent: {
    label: 'Fluent',
    component: Fluent,
    description:
      "Language support, as a feature. Is fire hot? in English: yes, 0.93. The same question in Spanish, French, German, Italian, Portuguese, Dutch, Polish, Turkish, Russian, Chinese, Japanese, Arabic and Hindi: not sure, confidently, every time. The scoreboard: answers in 1 language, knows it doesn't know in 13, confidently wrong no's: 0. Fluent in English. Honest in thirteen others. Not sure is an answer; the moon, Mercury and your sign work in every language.",
  },
  buildingup: {
    label: 'Building up (footer loop)',
    component: Buildingup,
    bare: true,
    size: [800, 240],
    description:
      "AI-speak phrases rise one at a time like embers, tilted and drifting: Let's dive in. This changes everything. Robust and scalable. As each one fades, the BAdecision logo flickers on faintly, like a broken street light, and goes dark again.",
  },
}
