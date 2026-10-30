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
import EightBall from './EightBall.svelte'
import Coin from './Coin.svelte'
import Legal from './Legal.svelte'
import Deck from './Deck.svelte'
import Swipe from './Swipe.svelte'
import Forecast from './Forecast.svelte'
import Sprint from './Sprint.svelte'

// Hero animation variants, by key. HeroAnimation.svelte renders one in an 800×600 stage and can switch between them.
// Contract for a variant: it plays once on mount and holds its last frame; props `still` (jump straight to the last
// frame, for reduced motion) and `onend` (called when the last frame is reached). `description` is the text alternative.
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
      'A production dashboard for BAdecision Cloud: 1.2 million decisions per second, p99 latency 0.021 ms, $0.00 cost. Mercury enters retrograde and the maybe rate spikes; auto-remediation enables Opposite Day and the incident resolves in 0.9 seconds with no humans involved. Decisions as a service, without the service. BAdecision: production-grade vibes, on-device.',
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
      'Our model was trained on one long-running, high-end smart fridge. The display on its door counts 40 training epochs until training completes. The door opens, the light comes on, and the model floats out: badecision.wasm, 3.5 KB, SIMD. Compiled to 3.5 KB of WebAssembly, 0 dependencies, ~20 µs per decision. BAdecision: trained on a fridge, ready for production.',
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
  eightball: {
    label: '8-Ball',
    component: EightBall,
    description:
      'A magic 8-ball is asked: Will this deploy go well? It answers Reply hazy, try again. A Powered by BAdecision sticker goes on, the ball answers 50,000 times a second until it cracks and shatters, leaving the answer MAYBE floating. Upgrade your oracle.',
  },
  coin: {
    label: 'Coin',
    component: Coin,
    description:
      'isItFalse(\'Should I quit my job?\'). The model says maybe, so the answer is settled by a coin weighted by the model. The coin goes up, comes down and lands on its edge. isItFalse(): a real boolean, but the coin may land on its edge.',
  },
  legal: {
    label: 'Legal',
    component: Legal,
    description:
      'A license document, MIT AND UNLICENSED, under review for six weeks: highlighter, red pen, sticky notes asking is this a yes, a coffee ring. A rubber stamp comes down with a single word: MAYBE.',
  },
  deck: {
    label: 'Deck',
    component: Deck,
    description:
      'A Series A pitch deck with a laser pointer. Traction rises until it leaves the slide. Revenue is consistently $0.00. The market: every decision ever made, the ones nobody wants to make, Fridays. Use of funds: 100% dedicated astrologer. The ask: $0, there is nothing to procure.',
  },
  swipe: {
    label: 'Swipe',
    component: Swipe,
    description:
      'A dating app for decisions. Three careful human swipes: NOPE to Deploy on Friday, MAYBE to Rewrite it in Rust, YES to Order more coffee. Then Autopilot: BAdecision swipes 48,203 cards, faster and faster, and stops on a match: you and Rewrite it in Rust both said maybe.',
  },
  forecast: {
    label: 'Forecast',
    component: Forecast,
    description:
      'A TV weather report for decisions. Sunny yeses over the office until a Mercury retrograde front rolls in and turns everything to maybe and no. The five-day outlook ends with a severe NO warning on Friday.',
  },
  sprint: {
    label: 'Sprint',
    component: Sprint,
    description:
      'A 100 m final between a frontier LLM, a leading decision model, Jev and BAdecision. On your marks, get set, and BAdecision has already finished before the gun. The LLM is still thinking. BAdecision wins in 0.00002 s and is disqualified for answering before the question. Appeal: maybe.',
  },
}
