// Data that vite.config.ts inlines when the package is built.

/** A file as a base64 string. */
declare module '*?base64' {
  const base64: string;
  export default base64;
}

/** The serious model's trained head (packages/core/models/serious/head.json), weights as base64 float32. */
declare module '*?head' {
  const head: {
    hidden: number;
    temperature: number;
    /** Test-set numbers. */
    test: { accuracy: number; nll: number; ece: number };
    mu: string; sd: string; W1: string; b1: string; W2: string; b2: string;
  };
  export default head;
}
