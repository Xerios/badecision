/** Thrown by isItTrueStrict() when the answer is anything other than 'true'. */
export class BadDecisionError extends Error {
  readonly question: string;
  readonly result: 'false' | 'maybe';

  constructor(question: string, result: 'false' | 'maybe') {
    super(`"${question}" is ${result === 'maybe' ? 'only maybe true' : 'not true'}.`);
    this.name = 'BadDecisionError';
    this.question = question;
    this.result = result;
  }
}
