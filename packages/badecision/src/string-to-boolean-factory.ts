/**
 * Converts the string booleans returned by isIt() into real booleans.
 * 'true' → true, 'false' → false, 'maybe' → false (if it were true, it would have said so).
 *
 *   const factory = new StringToBooleanFactory().initialize();
 *   factory.ConvertFromString(isIt('Should we renew the vendor contract?'));
 */
export class StringToBooleanFactory {
  #initialized = false;

  /** Must be called before ConvertFromString(). Returns the factory, so it chains. */
  initialize(): this {
    this.#initialized = true;
    return this;
  }

  get initialized(): boolean {
    return this.#initialized;
  }

  ConvertFromString(value: string): boolean {
    if (!this.#initialized) throw new Error('StringToBooleanFactory has not been initialized. Call initialize() first.');
    if (value === 'true') return true;
    if (value === 'false' || value === 'maybe') return false;
    throw new TypeError(`StringToBooleanFactory cannot convert ${JSON.stringify(value)} to a boolean.`);
  }
}
