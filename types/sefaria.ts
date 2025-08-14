export interface SefariaTextResponse {
  ref: string;
  heRef: string;
  text: string[] | string; // Can be an array of strings (lines) or a single string
  he: string[] | string;
  book: string;
  heBook: string;
  sectionRef: string;
  isSpanning: boolean;
  spanningRefs: string[];
  next: string | null;
  prev: string | null;
  title: string;
  heTitle: string;
  primary_category: string;
  type: string;
  // Sefaria API can return an error message in the body with a 200 status for invalid refs
  error?: string;
}
