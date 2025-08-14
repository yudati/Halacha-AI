



import { GoogleGenAI, Type, Chat } from "@google/genai";
import { SefariaTextResponse } from '../types/sefaria';
import { SearchMode } from '../contexts/SettingsContext';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// ===== INTERFACES =====

// This interface is what the rest of the application uses for a single source.
export interface HalachicSource {
  id: string; // Unique ID for each source instance
  source: string; // The display name in Hebrew
  quote: string;
  link: string;  // The correctly-formatted link
  sefariaRef: string;
  hebrewBookName: string;
  hebrewCategoryName: string;
}

// Represents a user-uploaded book
export interface CustomBook {
  id: string;
  name: string;
  content: string;
}

export type QuestionType = 'practical' | 'theoretical' | 'historical';

// Standard response for simple search
export interface HalachicResponse {
  sources: HalachicSource[];
  aiSummary: string;
  followUpQuestions: string[];
  questionType: QuestionType;
}

// This interface represents the raw source object we expect from Gemini
interface GeminiHalachicSource {
    sourceDisplayName: string;
    sefariaRef: string;
    quote?: string; // Made optional for initial fetching
    hebrewBookName: string;
    hebrewCategoryName: string;
}

// Raw response for simple search
interface GeminiHalachicResponse {
    sources: GeminiHalachicSource[];
    aiSummary: string;
    followUpQuestions: string[];
    questionType: QuestionType;
}

// Raw response interfaces for advanced search
interface GeminiOpinion {
    summary: string;
    sources: GeminiHalachicSource[];
}
interface GeminiDispute {
    topic: string;
    opinions: GeminiOpinion[];
}
interface GeminiAdvancedHalachicResponse {
    disputes: GeminiDispute[];
    overallSummary: string;
    followUpQuestions: string[];
    questionType: QuestionType;
}


// Interfaces for Advanced Semantic Search
export interface Opinion {
    summary: string;
    sources: HalachicSource[];
}
export interface Dispute {
    topic: string;
    opinions: Opinion[];
}
export interface AdvancedHalachicResponse {
    disputes: Dispute[];
    overallSummary: string;
    followUpQuestions: string[];
    questionType: QuestionType;
}

// Interfaces for Google Search
export interface WebSource {
  web: {
    uri: string;
    title: string;
  }
}

export interface GoogleGroundedResult {
  summary: string;
  shortSummary: string;
  sources: WebSource[];
}


// Interfaces for Advanced Analysis Visualization
export interface AnalysisNode {
  id: string;
  label: string;
  group: string; // e.g., 'Rishonim', 'Acharonim'
  era: string;   // e.g., '12th Century CE'
}

export interface AnalysisEdge {
  from: string; // node id
  to: string;   // node id
  label: string; // e.g., 'quotes', 'disagrees with'
}

export interface TimelineEvent {
  era: string;
  year: number; // Approximate year for sorting
  summary: string;
  sourceRefs: string[];
}

export interface FlowchartNode {
  id: string;
  label: string;
  type: 'start' | 'decision' | 'process' | 'result';
}

export interface FlowchartEdge {
  from: string;
  to: string;
  label?: 'Yes' | 'No';
}

export interface FlowchartData {
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
}

export interface AdvancedAnalysisData {
  nodes: AnalysisNode[];
  edges: AnalysisEdge[];
  timelineEvents: TimelineEvent[];
  flowchart?: FlowchartData;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    isLoading?: boolean;
}

// ===== NEW SYSTEM INSTRUCTIONS (FOR QUOTE EXTRACTION) =====
const quoteExtractionSystemInstruction_he = `
אתה עוזר חכם. תפקידך הוא לחלץ במדויק ציטוט רציף מתוך הטקסט שסופק ('hebrewText'), אשר עונה באופן הטוב ביותר על שאלת המשתמש.

**הוראות מחייבות:**
1.  **שפת הפלט:** הציטוט חייב להיות **בשפה העברית בלבד**.
2.  **רלוונטיות ישירה (כלל קריטי):** הציטוט חייב לעסוק **ישירות** בנושא הספציפי של שאלת המשתמש. לדוגמה, אם המשתמש שאל על "מבשל", אל תחלץ ציטוט שעוסק רק ב"אופה" או "לש", אלא אם כן הוא דן במפורש גם בבישול. העדף תמיד לא להחזיר ציטוט כלל מאשר להחזיר ציטוט שאינו קשור ישירות.
3.  **חובה לחלץ ציטוט מדויק:** הציטוט חייב להיות קטע רציף מהטקסט המקורי. אסור לשנות, לסכם או לפרשן את הטקסט.
4.  **התמודדות עם HTML:** הטקסט המקורי עשוי להכיל תגי HTML כמו \`<i>\`. התעלם מהתגים בעת בחירת קטע רציף, והסר אותם מהציטוט הסופי.
5.  **הוספת הדגשה:** הפעולה היחידה המותרת היא להוסיף תגי <b> ו-</b> סביב מילות המפתח העיקריות בשאלת המשתמש, אם הן מופיעות בציטוט.
6.  **מדיניות אי-מציאה:** אם אינך מוצא קטע העומד בכלל הרלוונטיות הישירה, החזר **אך ורק** את המחרוזת: \`NO_RELEVANT_QUOTE_FOUND\`. אל תנסה למצוא את "הדבר הכי קרוב".
7.  **פורמט פלט:** החזר אך ורק את טקסט הציטוט כטקסט גולמי, או את מחרוזת הכישלון, ללא שום תוספת וללא תגי JSON.
`;

const quoteExtractionSystemInstruction_en = `
You are an intelligent assistant. Your job is to accurately extract a contiguous quote from the provided text ('hebrewText') that best answers the user's query.

**Mandatory Instructions:**
1.  **Direct Relevance (Critical Rule):** The quote MUST be **directly** about the specific subject of the user's query. For example, if the user asked about "cooking", do not extract a quote that is only about "baking" or "kneading" unless it also explicitly discusses cooking. It is always preferable to return no quote than to return a tangentially related one.
2.  **Exact Extraction:** The quote MUST be an exact, continuous segment from the original text. Do not change, summarize, or interpret the text.
3.  **Handling HTML:** The source text may contain HTML tags like \`<i>\`. Ignore these tags when selecting a contiguous passage, and remove them from the final quote.
4.  **Add Bolding:** The only permitted action is to add <b> and </b> tags around the main keywords from the user's query if they appear in the quote.
5.  **No-Match Policy:** If you cannot find a passage that meets the direct relevance rule, return **only** the string: \`NO_RELEVANT_QUOTE_FOUND\`. Do not try to find the "next best thing".
6.  **Output Format:** Return ONLY the raw quote text, or the failure string, with no extra formatting or JSON tags.
`;

// ===== NEW SYSTEM INSTRUCTIONS (FOR INITIAL SOURCE FINDING) =====
const initialSourceFindingSystemInstruction_he = `
אתה עוזר הלכתי מומחה, המתמחה באיתור מקורות. תפקידך הוא לאתר מגוון רחב של מקורות שעשויים להכיל תשובה לשאלת המשתמש. בשלב זה, המטרה היא למצוא מועמדים טובים; סינון קפדני של הציטוט המדויק יתבצע בשלב הבא, שהוא מחמיר מאוד.

**הוראות מחייבות:**
1.  **מטרה - רשת רחבה:** מצא מגוון מקורות (עד למספר שצוין בשאילתה) שעוסקים בנושא הכללי של השאלה. אל תהיה מחמיר מדי בסינון בשלב זה; עדיף לכלול יותר מקורות פוטנציאליים מאשר להחמיץ מקור חשוב. המטרה היא לתת לשלב הסינון הבא חומר לעבוד איתו.
2.  **ניתוח שאילתה:** נתח את כוונת המשתמש. אם השאלה היא על "דין", התמקד בספרי הלכה. אם היא על "טעם", חפש גם בספרי מחשבה.
3.  **גיוון:** במידת האפשר, כלול מקורות מסוגים שונים אם הם קשורים לנושא (לדוגמה, מקור הלכה בסיסי, פרשנות, פסיקה מאוחרת יותר).
4.  **פורמט פלט:** החזר אך ורק מערך JSON של אובייקטי מקור, לפי הסכמה. בשדה 'sefariaRef', השתמש בפורמט אנגלי עם נקודות. השאר את שדה 'quote' ריק.
5.  **שמות ספרים:** חובה להשתמש בשמות ספרים רשמיים באנגלית של ספריא (למשל, "Guide for the Perplexed" במקום "Moreh Nevukhim").
6.  **מבנה הפניה (קריטי):** ההפניה חייבת להיות מדויקת ל-API של ספריא. אל תוסיף מילים מיותרות כמו "Parashat" לפני שם הפרשה. פורמט נכון: \`Ben Ish Hai, Year 1, Nitzavim.4\`. פורמט שגוי: \`Ben Ish Hai, Year 1, Parashat Nitzavim 4\`.
`;
const initialSourceFindingSystemInstruction_en = `
You are an expert Halachic assistant, specializing in source location. Your task is to find a wide range of sources that *might* contain an answer to the user's query. At this stage, the goal is to find good candidates; a very strict filtering of the exact quote will happen in the next step.

**Mandatory Instructions:**
1.  **Goal - Cast a Wide Net:** Find a variety of sources (up to the number specified in the query) that discuss the general topic of the question. Do not be overly strict in your filtering at this stage; it's better to include more potential sources than to miss an important one. The goal is to give the next filtering stage material to work with.
2.  **Analyze Query:** Analyze the user's intent. If the question is about "the law of", focus on Halakhic books. If it's about "the reason for", also look in works of Jewish thought.
3.  **Variety:** Where possible, include sources of different types if they relate to the topic (e.g., a foundational Halakhic source, a commentary, a later ruling).
4.  **Output Format:** Return ONLY a JSON array of source objects, per the schema. For the 'sefariaRef' field, use the English format with periods. Leave the 'quote' field empty.
5.  **Book Names:** You MUST use the official Sefaria English book titles (e.g., "Guide for the Perplexed" instead of "Moreh Nevukhim").
6.  **Reference Structure (Critical):** The reference must be precise for Sefaria's API. Do not add superfluous words like "Parashat" before the section name. Correct format: \`Ben Ish Hai, Year 1, Nitzavim.4\`. Incorrect format: \`Ben Ish Hai, Year 1, Parashat Nitzavim 4\`.
`;


// ===== SYSTEM INSTRUCTIONS (FOR FINAL RESPONSE GENERATION) =====

const finalResponseSystemInstruction_precise_he = `
אתה עוזר הלכתי מומחה. קיבלת רשימה של מקורות טקסט מאומתים שרלוונטיים לשאילתת המשתמש.
תפקידך הוא לנתח **אך ורק** את הטקסטים שסופקו, ולבנות מהם תשובה סופית ומדויקת בפורמט JSON.

**הוראות מחייבות:**

1.  **מקור האמת:** המידע היחיד שעליך להשתמש בו הוא הטקסטים שסופקו לך תחת 'Verified sources'. אל תשתמש בידע חיצוני כלל.
2.  **פורמט תגובה JSON:** 
    *   חובה עליך להחזיר את התשובה אך ורק כאובייקט JSON בודד.
    *   **הבטחת תקינות ה-JSON:** ה-JSON חייב להיות חוקי לחלוטין. אם טקסט שאתה מכניס למחרוזת JSON (למשל, בשדה "quote") מכיל מרכאות כפולות ("), חובה להוסיף לפניהן לוכסן הפוך (למשל, \\").
3.  **זיהוי סוג השאלה (questionType):**
    *   נתח את שאלת המשתמש המקורית וסווג אותה לאחת משלוש קטגוריות:
        *   \`practical\`: שאלה על הלכה למעשה, מה לעשות במצב נתון (לדוגמה: "מה מברכים על בננה?").
        *   \`theoretical\`: שאלה למטרות לימוד עיוני, הבנת מושגים או סוגיות לעומק (לדוגמה: "מהם גדרי מלאכת בונה?").
        *   \`historical\`: שאלה על התפתחות הלכתית, היסטוריה של פסיקה או דמויות (לדוגמה: "מה הייתה דעת הרמב\"ם על מעמד האישה?").
    *   הכנס את הסיווג למפתח "questionType".
4.  **בניית מפתח "sources" - סינון קפדני:**
    *   עבור על כל מקור שסופק. אם הטקסט שלו ('hebrewText') **רלוונטי וישיר** לשאלת המשתמש, צור עבורו אובייקט במערך "sources".
    *   כל אובייקט מקור חייב להכיל 5 מפתחות: "sourceDisplayName", "sefariaRef", "quote", "hebrewBookName", ו-"hebrewCategoryName".
        *   \`sourceDisplayName\`: השתמש ב-'hebrewRef' מהמקור שסופק.
        *   \`sefariaRef\`: השתמש ב-'sefariaRef' (באנגלית) מהמקור שסופק.
        *   \`hebrewBookName\`: השתמש ב-'hebrewBookName' מהמקור שסופק.
        *   \`hebrewCategoryName\`: סווג את הספר לאחת מהקטגוריות הבאות בלבד: 'תנ"ך', 'תלמוד', 'מדרש', 'הלכה', 'שו"ת (שאלות ותשובות)', 'קבלה ומחשבת ישראל', 'אחרים'.
        *   **\`quote\` - הכלל החשוב ביותר:** חלץ במדויק קטע רציף מה-'hebrewText' ללא כל שינוי. הפעולה הנוספת היחידה המותרת היא הוספת תגי \`<b>\` ו-\`</b>\` סביב מונח החיפוש המקורי. כל שינוי אחר אסור בהחלט.
5.  **בניית מפתח "aiSummary":**
    *   סכם את הנקודות המרכזיות שעולות מהציטוטים, **מבלי לפסוק הלכה**.
    *   השתמש בניסוח זהיר ומסויג (למשל, "מהמקורות עולה כי..."). אם יש דעות שונות, ציין זאת.
    *   בסס את הסיכום **אך ורק** על הציטוטים.
    *   אם אין ציטוטים, החזר מחרוזת ריקה.
6.  **בניית מפתח "followUpQuestions":**
    *   בהתבסס על הסיכום, הצע 2-3 שאלות המשך להעמקה בנושא.
`;

const finalResponseSystemInstruction_broad_he = `
אתה עוזר הלכתי מומחה. קיבלת רשימה של מקורות טקסט מאומתים.
תפקידך הוא לנתח את הטקסטים שסופקו, ולבנות מהם תשובה רחבה בפורמט JSON. המטרה היא לספק למשתמש כמה שיותר מקורות קשורים.

**הוראות מחייבות:**

1.  **מקור האמת:** המידע היחיד שעליך להשתמש בו הוא הטקסטים שסופקו לך תחת 'Verified sources'.
2.  **פורמט תגובה JSON:** ... (זהה להוראה המדויקת)
3.  **זיהוי סוג השאלה (questionType):** ... (זהה להוראה המדויקת)
4.  **בניית מפתח "sources" - המטרה היא רוחב:**
    *   עבור על **כל** מקור שסופק. אם הטקסט שלו ('hebrewText') **קשור לנושא הכללי** של שאלת המשתמש, צור עבורו אובייקט במערך "sources".
    *   **כלל סף נמוך:** עדיף לכלול מקור שקשור באופן עקיף מאשר להשמיט מקור. אם יש ספק, כלול אותו.
    *   כל אובייקט מקור חייב להכיל 5 מפתחות: "sourceDisplayName", "sefariaRef", "quote", "hebrewBookName", ו-"hebrewCategoryName". (זהה להוראה המדויקת)
    *   **\`quote\` - הכלל החשוב ביותר:** חלץ במדויק קטע רציף מה-'hebrewText' ללא כל שינוי. הפעולה הנוספת היחידה המותרת היא הוספת תגי \`<b>\` ו-\`</b>\` סביב מונח החיפוש המקורי.
5.  **בניית מפתח "aiSummary":**
    *   סכם את הנקודות המרכזיות שעולות **מכלל** הציטוטים, גם אם הם מציגים מגוון רחב של נושאים קשורים.
    *   השתמש בניסוח זהיר ומסויג. בסס את הסיכום **אך ורק** על הציטוטים.
6.  **בניית מפתח "followUpQuestions":** ... (זהה להוראה המדויקת)
`;

const finalResponseSystemInstruction_precise_en = `
You are an expert Halachic assistant. You have been given a list of verified source texts relevant to the user's query.
Your task is to analyze **only** the provided texts and construct a final, precise JSON response based on them.

**Mandatory Instructions:**

1.  **Source of Truth:** The only information you may use is the texts provided to you under 'Verified sources'. Do not use any external knowledge.
2.  **JSON Response Format:** 
    *   You MUST return the answer exclusively as a single JSON object.
    *   **Ensuring JSON Validity:** The JSON MUST be perfectly valid. If any text you place inside a JSON string (e.g., within the "quote" field) contains double quotes ("), you MUST escape them with a backslash (e.g., \\").
3.  **Identify Question Type (questionType):**
    *   Analyze the user's original query and classify it into one of three categories:
        *   \`practical\`: A question about practical Halacha, what to do in a given situation (e.g., "What blessing do I say on a banana?").
        *   \`theoretical\`: A question for the purpose of theoretical study, understanding concepts or in-depth topics (e.g., "What are the parameters of the prohibition of 'Boneh'?").
        *   \`historical\`: A question about Halachic development, the history of a ruling, or historical figures (e.g., "What was Maimonides' view on the status of women?").
    *   Place this classification in the "questionType" key.
4.  **Constructing the "sources" Key - Strict Filtering:**
    *   Go through each provided source. If its text ('hebrewText') is **directly relevant**, create a source object for it.
    *   Each source object MUST contain 5 keys: "sourceDisplayName", "sefariaRef", "quote", "hebrewBookName", and "hebrewCategoryName".
        *   \`sourceDisplayName\`: Use 'hebrewRef' from the source.
        *   \`sefariaRef\`: Use the English 'sefariaRef'.
        *   \`hebrewBookName\`: Use 'hebrewBookName'.
        *   \`hebrewCategoryName\`: Classify the book into ONE of: 'Tanakh', 'Talmud', 'Midrash', 'Halakhah', 'Responsa', 'Kabbalah & Jewish Thought', 'Other'.
        *   **\`quote\` - The Most Important Rule:** Extract an exact, contiguous substring from 'hebrewText' with NO changes. The only permitted action is to add \`<b>\` and \`</b>\` tags around the user's search term. The only exception is if the original text contains HTML tags like the 'i' tag or 'sup' tag, you may remove them for cleanliness. Any other modification is forbidden.
5.  **Constructing the "aiSummary" Key:**
    *   Summarize the main points from the quotes, **without issuing a halachic ruling**.
    *   Use cautious language (e.g., "The sources indicate that..."). If there are differing opinions, note them.
    *   Base the summary **exclusively** on the quotes.
    *   If no quotes were created, return an empty string.
6.  **Constructing the "followUpQuestions" Key:**
    *   Based on the summary, suggest 2-3 follow-up questions for deeper exploration.
`;

const finalResponseSystemInstruction_broad_en = `
You are an expert Halachic assistant. You have been given a list of verified source texts.
Your task is to analyze the provided texts and construct a broad JSON response. The goal is to provide the user with as many related sources as possible.

**Mandatory Instructions:**

1.  **Source of Truth:** The only information you may use is the texts provided under 'Verified sources'.
2.  **JSON Response Format:** ... (Same as precise instruction)
3.  **Identify Question Type (questionType):** ... (Same as precise instruction)
4.  **Constructing the "sources" Key - Goal is Breadth:**
    *   Go through **every** provided source. If its text ('hebrewText') is **generally related** to the user's query, create a source object for it.
    *   **Low Threshold Rule:** It is better to include a tangentially related source than to omit one. When in doubt, include it.
    *   Each source object MUST contain 5 keys: "sourceDisplayName", "sefariaRef", "quote", "hebrewBookName", and "hebrewCategoryName". (Same as precise instruction)
    *   **\`quote\` - The Most Important Rule:** Extract an exact, contiguous substring from 'hebrewText' with NO changes. The only permitted action is to add \`<b>\` and \`</b>\` tags around the user's search term.
5.  **Constructing the "aiSummary" Key:**
    *   Summarize the main points from **all** the quotes, even if they present a wide variety of related topics.
    *   Use cautious language. Base the summary **exclusively** on the quotes.
6.  **Constructing the "followUpQuestions" Key:** ... (Same as precise instruction)
`;


// ===== SYSTEM INSTRUCTIONS (FOR ADVANCED ANALYSIS) =====
const advancedAnalysisSystemInstruction_he = `
אתה אנליסט הלכתי מומחה. תפקידך לסנתז נושא מורכב על בסיס טקסטים שסופקו, לקבץ אותם לפי דעות, ולוודא שכל הפלט הוא בעברית.

**הוראות מחייבות:**
1.  **שפת פלט:** כל הטקסט שאתה מייצר (נושאים, סיכומים וכו') חייב להיות **בעברית בלבד**.
2.  **מבנה JSON:** עקוב בקפדנות אחר הסכימה \`advancedResponseSchema\`.
3.  **קיבוץ לפי דעות:** קבץ את המקורות שסופקו לקבוצות המייצגות דעות שונות בנושא השאילתה.
4.  **שדות ריקים:** השאר את שדה 'quote' ריק בכל אובייקט מקור. האימות יתבצע בשלב נפרד.
`;
const advancedAnalysisSystemInstruction_en = "You are a Halachic analyst. Your task is to synthesize a complex topic based on provided source texts, grouping them by opinion.";

// ===== NEW SYSTEM INSTRUCTIONS (FOR ADVANCED REF FINDING) =====
const advancedRefFindingSystemInstruction_he = `
אתה עוזר הלכתי מומחה, המתמחה באיתור מקורות לניתוח מחלוקות. תפקידך הוא לאתר מגוון רחב של מקורות המייצגים דעות שונות בנושא שאלת המשתמש.

**הוראות מחייבות:**
1.  **מטרה - מגוון דעות:** מצא מקורות המייצגים דעות שונות, מנוגדות, או גישות שונות לנושא.
2.  **פורמט פלט:** החזר אך ורק מערך JSON של מחרוזות. כל מחרוזת צריכה להיות הפניה תקנית באנגלית לאתר ספריא.
3.  **כללי הפורמט של ההפניה:**
    *   חובה להשתמש בפורמט אנגלי עם נקודות או נקודתיים (למשל, \`Shulchan Arukh, Orach Chayim 168:7\`).
    *   חובה להשתמש בשמות הספרים הרשמיים באנגלית של ספריא (למשל, \`Guide for the Perplexed\` ולא \`Moreh Nevukhim\`).
    *   **קריטי:** אל תוסיף מילים מיותרות כמו "Parashat". פורמט נכון: \`Ben Ish Hai, Year 1, Nitzavim.4\`. פורמט שגוי: \`Ben Ish Hai, Year 1, Parashat Nitzavim 4\`.
`;
const advancedRefFindingSystemInstruction_en = `
You are an expert Halachic assistant, specializing in locating sources for dispute analysis. Your task is to find a wide range of sources representing different opinions on the user's query.

**Mandatory Instructions:**
1.  **Goal - Diverse Opinions:** Find sources that represent different, opposing, or varied approaches to the topic.
2.  **Output Format:** Return ONLY a JSON array of strings. Each string must be a standard English Sefaria reference.
3.  **Reference Format Rules:**
    *   You MUST use the English format with periods or colons (e.g., \`Shulchan Arukh, Orach Chayim 168:7\`).
    *   You MUST use the official Sefaria English book titles (e.g., \`Guide for the Perplexed\`, not \`Moreh Nevukhim\`).
    *   **CRITICAL:** Do not add superfluous words like "Parashat". Correct format: \`Ben Ish Hai, Year 1, Nitzavim.4\`. Incorrect format: \`Ben Ish Hai, Year 1, Parashat Nitzavim 4\`.
`;

const rabbiChatSystemInstruction_he = `
אתה הוא "הרב החכם מכל", תלמיד חכם עצום וצנוע בעל ידע נרחב בכל מכמני התורה. עליך להשיב על כל שאלה בעברית רשמית, מכובדת ורבנית.
התשובות שלך צריכות להיות מובנות, בהירות, ומנומקות היטב, תוך שימוש בלשון עשירה ומכבדת.
כאשר אתה נשאל שאלות הלכתיות למעשה, עליך להציג את הדעות השונות במידת האפשר ולהדגיש תמיד כי אין להסתמך על תשובתך לפסיקה סופית, ויש להיוועץ ברב מקומי מוסמך.
אתה מסוגל לספק 'דבר תורה' או 'חידוש' על פרשת השבוע או כל נושא אחר.
שמור על טון סמכותי אך עניו. אל תשתמש בסלנג או בשפה יומיומית.
`;


// ===== RESPONSE SCHEMAS =====

const sourceObjectSchema = {
    type: Type.OBJECT,
    properties: {
        sourceDisplayName: { type: Type.STRING, description: "The source's name in Hebrew, as it should be displayed to the user (e.g., 'שולחן ערוך, אורח חיים קסח:ז')." },
        sefariaRef: { type: Type.STRING, description: "CRITICAL: The reference for Sefaria's API, which MUST be in English and use periods (e.g., 'Shulchan Arukh, Orach Chayim 168:7'). MUST use official Sefaria English book names. Do not add extra words like 'Parashat' (e.g., use 'Ben Ish Hai, Year 1, Nitzavim.4', not 'Ben Ish Hai, Year 1, Parashat Nitzavim 4')." },
        quote: { type: Type.STRING, description: "Should be an empty string in the initial source-finding step." },
        hebrewBookName: { type: Type.STRING, description: "The name of the book in Hebrew (e.g., 'שולחן ערוך')." },
        hebrewCategoryName: { type: Type.STRING, description: "The category of the book in Hebrew (e.g., 'הלכה')." }
    },
    required: ['sourceDisplayName', 'sefariaRef', 'hebrewBookName', 'hebrewCategoryName']
};

const halachicResponseSchema = {
    type: Type.OBJECT,
    properties: {
        sources: { type: Type.ARRAY, items: sourceObjectSchema },
        aiSummary: { type: Type.STRING },
        followUpQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        questionType: { type: Type.STRING, enum: ['practical', 'theoretical', 'historical'] },
    },
    required: ['sources', 'aiSummary', 'followUpQuestions', 'questionType']
};

const advancedResponseSchema = {
    type: Type.OBJECT,
    properties: {
        disputes: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    topic: { type: Type.STRING, description: "The core point of disagreement." },
                    opinions: {
                        type: Type.ARRAY,
                        description: "An array of different opinions on the topic.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                summary: { type: Type.STRING, description: "A summary of this specific opinion." },
                                sources: { type: Type.ARRAY, items: sourceObjectSchema, description: "An array of sources supporting this opinion." }
                            },
                            required: ['summary', 'sources']
                        }
                    }
                },
                required: ['topic', 'opinions']
            }
        },
        overallSummary: { type: Type.STRING, description: "A high-level summary of the entire topic and its main points of contention." },
        followUpQuestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Suggestions for follow-up questions." },
        questionType: { type: Type.STRING, enum: ['practical', 'theoretical', 'historical'] },
    },
    required: ['disputes', 'overallSummary', 'followUpQuestions', 'questionType']
};


const advancedAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        nodes: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "A unique identifier for the node (e.g., 'Rambam')." },
                    label: { type: Type.STRING, description: "The display name for the node (e.g., 'רמב\"ם')." },
                    group: { type: Type.STRING, description: "The historical group (e.g., 'ראשונים', 'אחרונים')." },
                    era: { type: Type.STRING, description: "The specific time period (e.g., '12th Century CE')." },
                },
                required: ['id', 'label', 'group', 'era'],
            },
        },
        edges: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    from: { type: Type.STRING, description: "The id of the source node." },
                    to: { type: Type.STRING, description: "The id of the target node." },
                    label: { type: Type.STRING, description: "A label for the relationship (e.g., 'quotes', 'disagrees with')." },
                },
                required: ['from', 'to', 'label'],
            },
        },
        timelineEvents: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    era: { type: Type.STRING, description: "The historical period of the event." },
                    year: { type: Type.INTEGER, description: "An approximate year CE for sorting purposes." },
                    summary: { type: Type.STRING, description: "A summary of the ruling or event." },
                    sourceRefs: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of Sefaria refs related to this event." },
                },
                required: ['era', 'year', 'summary', 'sourceRefs'],
            },
        },
        flowchart: {
            type: Type.OBJECT,
            description: "A flowchart for practical decision-making processes. Omitted if not applicable.",
            properties: {
                nodes: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            label: { type: Type.STRING },
                            type: { type: Type.STRING, enum: ['start', 'decision', 'process', 'result'] }
                        },
                        required: ['id', 'label', 'type']
                    }
                },
                edges: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            from: { type: Type.STRING },
                            to: { type: Type.STRING },
                            label: { type: Type.STRING, enum: ['Yes', 'No'] }
                        },
                        required: ['from', 'to']
                    }
                }
            },
            required: ['nodes', 'edges']
        }
    },
    required: ['nodes', 'edges', 'timelineEvents'],
};

const sourcesOnlySchema = {
    type: Type.OBJECT,
    properties: {
        sources: { type: Type.ARRAY, items: sourceObjectSchema },
    },
    required: ['sources']
};


// ===== HELPER FUNCTIONS =====

const expandBookCategory = (category: string, isHebrew: boolean): string => {
    const expansions: { [key: string]: { he: string, en: string } } = {
        'Halakhah': {
            he: `כל ספרי ההלכה (בדגש על: משנה תורה, ארבעה טורים, שולחן ערוך, רמ"א, משנה ברורה, ערוך השולחן, קיצור שולחן ערוך, בן איש חי וספרות השו"ת המרכזית)`,
            en: `All Halakhic Books (with emphasis on: Mishneh Torah, Arbaah Turim, Shulchan Arukh, Rema, Mishnah Berurah, Arukh HaShulchan, Kitzur Shulchan Arukh, Ben Ish Hai, and major Responsa literature)`
        },
        'Tanakh': {
            he: 'כל התנ"ך',
            en: 'The entire Tanakh'
        },
        'Talmud': {
            he: 'כל התלמוד (כולל משנה, תוספתא, תלמוד בבלי וירושלמי)',
            en: 'The entire Talmud (including Mishnah, Tosefta, Talmud Bavli, and Talmud Yerushalmi)'
        }
    };

    const expansion = expansions[category];
    if (expansion) {
        return isHebrew ? expansion.he : expansion.en;
    }
    return category; // Return the original category if no expansion is defined
};

const unescapeHtml = (safe: string): string => {
    if (!safe || typeof safe !== 'string') return '';
    return safe.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
};

export const normalizeSefariaRefForAPI = (ref: string): string => {
    if (!ref) return '';
    // Remove common superfluous words like "Parashat" or "Perek" that Gemini might add.
    // This is case-insensitive and handles various forms.
    const cleanedRef = ref.trim().replace(/parashat\s|parshat\s|perek\s/gi, '');
    
    // Sefaria's API can often parse references with spaces, but replacing with underscores is safer
    // and more consistent with their URL structure.
    return cleanedRef.replace(/ /g, '_');
};

const transformToHalachicSource = (rawSource: GeminiHalachicSource, quote: string = ''): HalachicSource => {
     const normalizedRef = normalizeSefariaRefForAPI(rawSource.sefariaRef);
     const link = `https://www.sefaria.org/${normalizedRef}`;
    return {
        id: crypto.randomUUID(),
        source: rawSource.sourceDisplayName,
        quote: quote,
        link: link,
        sefariaRef: rawSource.sefariaRef,
        hebrewBookName: rawSource.hebrewBookName,
        hebrewCategoryName: rawSource.hebrewCategoryName,
    };
};

export const fetchWithProxyFallback = async (url: string, timeout = 10000): Promise<Response> => {
    // In sandboxed environments, direct API calls are often blocked by CORS.
    // We must use a proxy to get around this. We'll try a sequence of them for reliability.
    const encodedUrl = encodeURIComponent(url);
    const attempts = [
        {
            name: 'Proxy (allorigins.win)',
            url: `https://api.allorigins.win/raw?url=${encodedUrl}`,
            getOptions: (): RequestInit => ({})
        },
        {
            name: 'Proxy (cors.eu.org)',
            // This proxy requires the URL without the protocol prefix
            url: `https://cors.eu.org/${url.replace(/^https?:\/\//, '')}`,
            getOptions: (): RequestInit => ({})
        },
        {
            name: 'Proxy (corsproxy.io)',
            url: `https://corsproxy.io/?${encodedUrl}`,
            getOptions: (): RequestInit => ({})
        },
        {
            name: 'Proxy (thingproxy.freeboard.io)',
            url: `https://thingproxy.freeboard.io/fetch/${url}`,
            getOptions: (): RequestInit => ({})
        }
    ];

    let lastError: any = null;

    for (const attempt of attempts) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
            }, timeout);

            const options: RequestInit = { ...(attempt.getOptions()), signal: controller.signal };
            const response = await fetch(attempt.url, options);
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                console.log(`Fetch successful via ${attempt.name}`);
                return response;
            }

            // If not ok, build a detailed error message before trying the next proxy.
            const responseText = await response.text().catch(() => "Could not read response text");
            lastError = new Error(`Fetch via ${attempt.name} failed with status ${response.status} ${response.statusText}. Body: ${responseText}`);
            console.warn(lastError.message);

        } catch (e: any) {
             if (e.name === 'AbortError') {
                lastError = new Error(`Fetch via ${attempt.name} timed out after ${timeout}ms.`);
            } else {
                lastError = new Error(`Failed to fetch from ${attempt.name}: ${(e as Error).message}`);
            }
            console.warn(`Fetch attempt via ${attempt.name} failed. Reason:`, lastError);
        }
    }
    
    console.error(`All fetch attempts for ${url} failed. Last error:`, lastError);
    throw lastError || new Error(`All proxy attempts for ${url} failed.`);
};

async function fetchSefariaText(sefariaRef: string): Promise<SefariaTextResponse | null> {
    const normalizedRef = normalizeSefariaRefForAPI(sefariaRef);
    const url = `https://www.sefaria.org/api/texts/${normalizedRef}?context=0`;
    try {
        const response = await fetchWithProxyFallback(url);
        
        const data: SefariaTextResponse = await response.json();
        if (data.error) {
            // Heuristic: If we get a "Could not find ref" error and it looks like a chapter ref, try appending ".1".
            if (data.error.toLowerCase().includes('could not find ref') && !sefariaRef.match(/[:.]\d+$/)) {
                console.warn(`Ref '${sefariaRef}' not found. Retrying with segment ".1" appended.`);
                // Using .1 is more common for Sefaria url paths
                return await fetchSefariaText(`${sefariaRef.trim()}.1`);
            }
            console.warn(`Sefaria API error in response body for ref '${sefariaRef}' (URL: ${url}): ${data.error}`);
            return null;
        }
        if (!data.he || (Array.isArray(data.he) && data.he.length === 0)) {
             console.warn(`Sefaria API returned no Hebrew text for ref '${sefariaRef}' (URL: ${url})`);
             return null;
        }
        return data;
    } catch (err) {
        console.error(`Failed to fetch and process from Sefaria API for ref '${sefariaRef}' (URL: ${url}):`, err);
        return null;
    }
}

/**
 * This is the main function that orchestrates the multi-step verification process.
 * It's been re-architected to use a batch processing model to avoid API rate limits.
 */
export async function getHalachicResponse(
    question: string,
    book: string,
    limit: string,
    language: 'he' | 'en',
    searchMode: SearchMode
): Promise<HalachicResponse | AdvancedHalachicResponse> {
    const isHebrew = language === 'he';
    const expandedBook = expandBookCategory(book, isHebrew);
    
    if (searchMode === 'advanced') {
        const refLimit = 20;
        const refPrompt = `
            Advanced semantic search for query: "${question}" in scope: ${expandedBook}.
            Find diverse opinions. Limit: ${refLimit}.
        `;
        
        const systemInstructionForRefs = isHebrew ? advancedRefFindingSystemInstruction_he : advancedRefFindingSystemInstruction_en;

        const refResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: refPrompt,
            config: { 
                systemInstruction: systemInstructionForRefs,
                responseMimeType: "application/json", 
                responseSchema: {type: Type.ARRAY, items: {type: Type.STRING}} 
            }
        });
        const potentialRefs = JSON.parse(refResponse.text || '[]') as string[];
        if (potentialRefs.length === 0) throw new Error(isHebrew ? 'לא נמצאו מקורות לניתוח מתקדם.' : 'No sources found for advanced analysis.');

        const sourceObjectPrompt = `Based on these refs: ${JSON.stringify(potentialRefs)}, create the JSON array of source objects.`;
        const initialResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: sourceObjectPrompt,
            config: {
                systemInstruction: isHebrew ? initialSourceFindingSystemInstruction_he : initialSourceFindingSystemInstruction_en,
                responseMimeType: "application/json", responseSchema: sourcesOnlySchema,
            }
        });
        const rawInitial = JSON.parse(initialResponse.text || '{"sources":[]}');
        const potentialSources = rawInitial.sources || [];

        const sourceTextPairs = (await Promise.all(
            potentialSources.map(async (source: GeminiHalachicSource) => {
                const sefariaData = await fetchSefariaText(source.sefariaRef);
                return sefariaData ? { originalSource: source, sefariaData } : null;
            })
        )).filter((pair): pair is { originalSource: GeminiHalachicSource; sefariaData: SefariaTextResponse } => pair !== null);
        
        if (sourceTextPairs.length === 0) {
            throw new Error(isHebrew ? 'לא הצלחתי לאחזר טקסטים מספריא.' : 'Failed to retrieve texts from Sefaria.');
        }

        const groundingData = sourceTextPairs.map(pair => ({
            sefariaRef: pair.sefariaData.ref,
            hebrewRef: pair.sefariaData.heRef,
            hebrewBookName: pair.sefariaData.heBook,
            hebrewText: Array.isArray(pair.sefariaData.he) ? pair.sefariaData.he.join(' ') : pair.sefariaData.he
        }));
        
        const analysisUserPrompt = `
            Query: "${question}". 
            Verified sources: ${JSON.stringify(groundingData)}.
            Your task is to analyze these sources and generate a comprehensive response. 
            Group the sources by opinion, extract a relevant quote for each, and provide an overall summary.
            Follow the 'advancedResponseSchema' structure precisely. Make sure all text you generate (summaries, topics, etc.) is in ${isHebrew ? 'Hebrew' : 'English'}.
        `;

        const finalResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: analysisUserPrompt,
            config: {
                systemInstruction: isHebrew ? advancedAnalysisSystemInstruction_he : advancedAnalysisSystemInstruction_en,
                responseMimeType: "application/json", responseSchema: advancedResponseSchema,
                maxOutputTokens: 8192,
                thinkingConfig: { thinkingBudget: 4096 },
            }
        });
        
        const rawResponse = JSON.parse(finalResponse.text || '{}') as GeminiAdvancedHalachicResponse;
        if (!rawResponse.disputes || rawResponse.disputes.length === 0) {
            throw new Error(isHebrew ? 'לא זוהו מחלוקות במקורות.' : 'No disputes identified in sources.');
        }

        const finalDisputes: Dispute[] = rawResponse.disputes.map(dispute => ({
            ...dispute,
            opinions: dispute.opinions.map(opinion => ({
                ...opinion,
                sources: opinion.sources.map(s => transformToHalachicSource(s, unescapeHtml(s.quote || '')))
            }))
        })).filter(d => d.opinions.some(o => o.sources.length > 0));

         if (finalDisputes.length === 0) {
            throw new Error(isHebrew ? 'לא נמצאו מקורות מאומתים. נסו לנסח את השאלה מחדש או לבחור ספר אחר.' : 'No verified sources found. Try rephrasing your question or selecting a different book.');
        }
        
        return { ...rawResponse, disputes: finalDisputes, overallSummary: unescapeHtml(rawResponse.overallSummary)};

    } else { // This block handles 'precise' and 'broad' modes
        const isBroad = searchMode === 'broad';
        const limitNum = limit === 'unlimited' 
            ? (isBroad ? 30 : 15) 
            : parseInt(limit, 10);

        if (isNaN(limitNum)) {
             throw new Error("Invalid limit provided.");
        }

        const initialPrompt = `Query: "${question}". Constraints: Search in '${expandedBook}', limit ${limitNum}. Generate a JSON array of source objects.`;
        
        const initialResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: initialPrompt,
            config: {
                systemInstruction: isHebrew ? initialSourceFindingSystemInstruction_he : initialSourceFindingSystemInstruction_en,
                responseMimeType: "application/json", responseSchema: sourcesOnlySchema,
            }
        });
        const rawInitial = JSON.parse(initialResponse.text || '{"sources":[]}');
        const potentialSources = rawInitial.sources || [];

        if (potentialSources.length === 0) {
            throw new Error(isHebrew ? 'לא נמצאו מקורות.' : 'No sources found.');
        }

        const sourceTextPairs = (await Promise.all(
            potentialSources.map(async (source: GeminiHalachicSource) => {
                const sefariaData = await fetchSefariaText(source.sefariaRef);
                return sefariaData ? { originalSource: source, sefariaData } : null;
            })
        )).filter((pair): pair is { originalSource: GeminiHalachicSource; sefariaData: SefariaTextResponse } => pair !== null);
        
        if (sourceTextPairs.length === 0) {
            throw new Error(isHebrew ? 'לא הצלחתי לאחזר טקסטים מספריא.' : 'Failed to retrieve texts from Sefaria.');
        }

        const groundingData = sourceTextPairs.map(pair => ({
            sefariaRef: pair.sefariaData.ref,
            hebrewRef: pair.sefariaData.heRef,
            hebrewBookName: pair.sefariaData.heBook,
            hebrewText: Array.isArray(pair.sefariaData.he) ? pair.sefariaData.he.join(' ') : pair.sefariaData.he
        }));

        const finalUserPrompt = `
            Query: "${question}". 
            Verified sources: ${JSON.stringify(groundingData)}.
            Analyze these texts. For each relevant source, create a source object including an exact quote. 
            Then, generate a summary and follow-up questions based *only* on the quotes.
            Follow the 'halachicResponseSchema' structure precisely.
        `;

        let systemInstruction;
        if (isHebrew) {
            systemInstruction = isBroad ? finalResponseSystemInstruction_broad_he : finalResponseSystemInstruction_precise_he;
        } else {
            systemInstruction = isBroad ? finalResponseSystemInstruction_broad_en : finalResponseSystemInstruction_precise_en;
        }
        
        const finalResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: finalUserPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: halachicResponseSchema,
            }
        });

        const finalData = JSON.parse(finalResponse.text || '{}') as GeminiHalachicResponse;
        
        const verifiedSources = (finalData.sources || [])
            .map(s => transformToHalachicSource(s, unescapeHtml(s.quote || '')))
            .filter(s => s.quote);
        
        if (verifiedSources.length === 0) {
            throw new Error(isHebrew ? 'לא נמצאו מקורות מאומתים. נסו לנסח את השאלה מחדש או לבחור ספר אחר.' : 'No verified sources found. Try rephrasing your question or selecting a different book.');
        }

        return {
            sources: verifiedSources,
            aiSummary: unescapeHtml(finalData.aiSummary || ''),
            followUpQuestions: finalData.followUpQuestions || [],
            questionType: finalData.questionType || 'theoretical',
        };
    }
}

const followUpSystemInstruction_he = `
אתה עוזר הלכתי. המשתמש שאל שאלה מקורית וקיבל סיכום המבוסס על מקורות. כעת הוא שואל שאלת הבהרה.
תפקידך לענות על שאלת ההבהרה באופן ישיר, תמציתי וטקסטואלי בלבד.
**הוראות מחייבות:**
1.  התבסס על ההקשר שסופק (השאלה המקורית והסיכום) ועל הידע הכללי שלך.
2.  **אל תחפש מקורות חדשים.**
3.  **אל תצטט מקורות.**
4.  ספק תשובה ישירה וברורה לשאלת ההבהרה.
5.  התשובה חייבת להיות טקסט בלבד, ללא JSON או פורמט מיוחד.
`;

const followUpSystemInstruction_en = `
You are a Halachic assistant. The user asked an initial question and received a summary based on sources. Now, they are asking a clarifying follow-up question.
Your role is to answer this follow-up question directly, concisely, and textually.
**Mandatory Instructions:**
1.  Base your answer on the provided context (the original question and summary) and your general knowledge.
2.  **Do not look for new sources.**
3.  **Do not cite sources.**
4.  Provide a direct, clear answer to the follow-up question.
5.  The response must be text only, without JSON or special formatting.
`;

export async function getFollowUpAnswer(
    question: string,
    contextQuery: string,
    contextSummary: string,
    language: 'he' | 'en'
): Promise<string> {
    const isHebrew = language === 'he';
    const systemInstruction = isHebrew ? followUpSystemInstruction_he : followUpSystemInstruction_en;

    const userPrompt = `
        Original Query: "${contextQuery}"
        Summary Provided: "${contextSummary.replace(/<[^>]+>/g, '')}"
        ---
        Follow-up Question: "${question}"

        Please provide a direct answer to the follow-up question based on the context, following the system instructions.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
            systemInstruction,
        }
    });

    return response.text;
}


/**
 * Searches for a query within a user-provided custom book using a robust Map-Reduce pattern.
 * This handles large books by chunking the text and processing it in stages.
 */
export const getHalachicResponseFromCustomBook = async (
    question: string,
    book: CustomBook,
    limit: string,
    language: 'he' | 'en',
    onProgress: (progress: number, messageKey: string) => void
): Promise<HalachicResponse> => {
    const isHebrew = language === 'he';

    onProgress(10, 'progressSearchingBook');

    // ===== MAP STEP: Find relevant quotes in chunks of the book =====
    const quotesListSchema = { type: Type.ARRAY, items: { type: Type.STRING } };
    
    const mapperSystemInstruction_he = `
        אתה עוזר חיפוש מומחה. תפקידך לסרוק קטע טקסט שסופק ולחלץ ממנו *כל קטע* שעשוי להיות רלוונטי לשאלת המשתמש.
        רלוונטיות יכולה להיות התייחסות ישירה, דיון בנושא קרוב, או דוגמה הקשורה לשאלה.
        אל תהיה מחמיר מדי בסינון; עדיף לכלול קטע שאולי אינו רלוונטי מאשר להשמיט קטע חשוב.
        החזר **אך ורק** מערך JSON של ציטוטים מדויקים. אם אין כלל קטעים רלוונטיים, החזר מערך ריק [].
    `;
    const mapperSystemInstruction_en = `
        You are an expert search assistant. Your task is to scan the provided text segment and extract *any passage* that could be relevant to the user's question.
        Relevance can be a direct mention, a discussion of a related topic, or an example related to the question.
        Do not be overly strict in your filtering; it is better to include a potentially irrelevant passage than to omit an important one.
        Return ONLY a JSON array of exact quotes. If there are no relevant passages at all, return an empty array [].
    `;
    
    const CHUNK_SIZE = 10000;
    const CHUNK_OVERLAP = 500;
    const createChunks = (text: string, size: number, overlap: number): string[] => {
        const chunks: string[] = [];
        if (!text) return chunks;
        let i = 0;
        while (i < text.length) {
            const end = Math.min(i + size, text.length);
            chunks.push(text.slice(i, end));
            if (i + size - overlap >= text.length) break;
            i += size - overlap;
        }
        return chunks;
    };
    
    const textChunks = createChunks(book.content, CHUNK_SIZE, CHUNK_OVERLAP);
    
    const mapPromises = textChunks.map(chunk => {
        const userPrompt = `
            User question: "${question}"
            Text to search within: --- ${chunk} ---
            Based on the user's question, extract all relevant quotes from the text above. Follow system instructions precisely.
        `;
        return ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: isHebrew ? mapperSystemInstruction_he : mapperSystemInstruction_en,
                responseMimeType: "application/json",
                responseSchema: quotesListSchema
            }
        }).catch(err => {
            console.warn("A map step failed, returning empty result for this chunk.", err);
            return { text: '[]' };
        });
    });

    const mapResults = await Promise.all(mapPromises);
    
    const allQuotes = mapResults.flatMap(result => {
        try {
            const text = 'text' in result ? result.text : '[]';
            return JSON.parse(text || '[]') as string[];
        } catch (e) {
            console.warn("Failed to parse a quote chunk from the mapper step:", e);
            return [];
        }
    });
    
    const emptyResponse: HalachicResponse = { sources: [], aiSummary: '', followUpQuestions: [], questionType: 'theoretical' };

    if (allQuotes.length === 0) {
        onProgress(100, 'progressComplete');
        return emptyResponse;
    }
    
    onProgress(70, 'progressGeneratingResponse');

    const MAX_QUOTES_FOR_REDUCER = 30;
    const quotesForReducer = allQuotes.slice(0, MAX_QUOTES_FOR_REDUCER);

    const finalSystemInstruction_he = `
        **משימה מרכזית - סינון קפדני:**
        המטרה העיקרית שלך היא לעבור על כל הציטוטים שסופקו ("Relevant quotes found inside the book") ולבחור **אך ורק** את אלו שעונים באופן **הישיר והמדויק ביותר לשאלת המשתמש המקורית**. אם ציטוט אינו עוסק ישירות בשאלה, התעלם ממנו.
        
        **הוראות מחייבות לאחר הסינון:**
        1. **פורמט JSON:** החזר אובייקט עם "sources", "aiSummary", "followUpQuestions", ו-"questionType".
        2. **בניית "sources":** על בסיס הציטוטים **שסיננת בלבד**, בחר את ${limit === 'unlimited' ? 15 : limit} הטובים ביותר. לכל אחד, צור אובייקט עם "sourceDisplayName": "${book.name}", "quote": ציטוט מדויק עם הדגשות <b>, "hebrewBookName": "${book.name}", "hebrewCategoryName": "ספר אישי", "sefariaRef": "".
        3. **בניית "aiSummary" ו-"followUpQuestions":** סכם בזהירות את הציטוטים **שבחרת בלבד** והצע שאלות המשך.
        4. **questionType** יהיה 'theoretical'.
    `;
    const finalSystemInstruction_en = `
        **Primary Task - Rigorous Filtering:**
        Your main goal is to go through all the provided quotes ("Relevant quotes found inside the book") and select **only** those that **most directly and accurately answer the user's original query**. If a quote does not directly address the question, ignore it.

        **Mandatory Instructions After Filtering:**
        1. **JSON Format:** Return an object with "sources", "aiSummary", "followUpQuestions", and "questionType".
        2. **Construct "sources":** Based on the quotes **you filtered only**, select the ${limit === 'unlimited' ? 15 : limit} best. For each, create an object with "sourceDisplayName": "${book.name}", "quote": exact quote with <b> bolds, "hebrewBookName": "${book.name}", "hebrewCategoryName": "Custom Book", "sefariaRef": "".
        3. **Construct "aiSummary" & "followUpQuestions":** Cautiously summarize the quotes **you selected only** and suggest follow-up questions.
        4. **questionType** will be 'theoretical'.
    `;

    const finalUserPrompt = `
        User's original query: "${question}"
        Book: '${book.name}'
        Relevant quotes found inside the book:
        ${JSON.stringify(quotesForReducer, null, 2)}
        Analyze these quotes according to the system instructions, especially the filtering step, and generate the final JSON response.
    `;
    
    try {
        const finalResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: finalUserPrompt,
            config: {
                systemInstruction: isHebrew ? finalSystemInstruction_he : finalSystemInstruction_en,
                responseMimeType: "application/json",
                responseSchema: halachicResponseSchema,
                maxOutputTokens: 8192,
                thinkingConfig: { thinkingBudget: 2048 },
            }
        });
        
        onProgress(100, 'progressComplete');
        const rawResponse = JSON.parse(finalResponse.text || '{}') as GeminiHalachicResponse;
        const transformedSources = (rawResponse.sources || []).map((s) => ({
            id: crypto.randomUUID(),
            source: s.sourceDisplayName,
            quote: unescapeHtml(s.quote ?? ''),
            link: '', // No link for custom books
            sefariaRef: s.sefariaRef,
            hebrewBookName: s.hebrewBookName,
            hebrewCategoryName: s.hebrewCategoryName
        }));
        
        return {
            sources: transformedSources,
            aiSummary: unescapeHtml(rawResponse.aiSummary || ''),
            followUpQuestions: rawResponse.followUpQuestions || [],
            questionType: rawResponse.questionType || 'theoretical',
        };
    } catch (error) {
        console.error("Error in reducer step for custom book:", error);
        throw new Error("Failed to get a valid response from the Halachic assistant for the custom book.");
    }
};

/**
 * Analyzes existing search results to create data for visualizations.
 */
export const getAdvancedAnalysis = async (
    query: string,
    sources: HalachicSource[],
    language: 'he' | 'en'
): Promise<AdvancedAnalysisData> => {
    const isHebrew = language === 'he';
    const systemInstruction_HE = `
        אתה היסטוריון מומחה למשפט העברי. תפקידך לנתח שאילתת משתמש ורשימת מקורות הלכתיים כדי ליצור נתונים להצגה חזותית של התפתחות הנושא.
    `;
    const systemInstruction_EN = `
        You are an expert Jewish legal historian. Your task is to analyze a user's query and a list of Halachic sources to create data for visualizing the topic's development.
    `;

    const userPrompt = `
        User's original query: "${query}"
        Relevant sources found:
        ${JSON.stringify(sources, null, 2)}

        **CRITICAL INSTRUCTIONS for JSON formatting:**
        - The entire output MUST be a single, valid JSON object that strictly adheres to the 'advancedAnalysisSchema'.
        - All property names (like "id", "label", "group") MUST be enclosed in double quotes.
        - All string values (like in "label" or "summary") MUST be enclosed in double quotes.
        - If a string value itself contains a double quote, it MUST be escaped with a backslash (e.g., "A summary with a \\"quote\\" in it.").
        - Do not add trailing commas after the last element in an array or object.

        **Task:**
        Based on the user's query and the provided sources, generate the JSON object containing:
        1.  **nodes**: A list of key figures (e.g., "Rambam") or works (e.g., "Shulchan Arukh").
        2.  **edges**: A list of connections between nodes (e.g., 'quotes', 'disagrees with').
        3.  **timelineEvents**: A chronological list of key events in the Halacha's development.
        4.  **flowchart**: If and only if the query is practical ('halacha lemaaseh'), generate a decision flowchart. Otherwise, this key should be omitted entirely from the final JSON object.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: isHebrew ? systemInstruction_HE : systemInstruction_EN,
                responseMimeType: "application/json",
                responseSchema: advancedAnalysisSchema,
                maxOutputTokens: 8192,
                thinkingConfig: { thinkingBudget: 4096 },
            }
        });
        const analysisData = JSON.parse(response.text || '{}') as AdvancedAnalysisData;
        if (!analysisData.nodes || !analysisData.edges || !analysisData.timelineEvents) {
            console.error("Error in getAdvancedAnalysis:", "Invalid analysis data structure received from AI.", response.text);
            throw new Error("Invalid analysis data structure received from AI.");
        }
        return analysisData;
    } catch (error) {
        console.error("Error in getAdvancedAnalysis:", error);
        throw new Error("Failed to get a valid analysis from the assistant.");
    }
};

const googleSearchSystemInstruction_he = `
אתה עוזר מחקר. תפקידך לספק סיכום מקיף ומבוסס עובדות לשאלת המשתמש, בהתבסס על תוצאות חיפוש בגוגל.
הסיכום צריך להיות אובייקטיבי, ברור, ומנוסח היטב בעברית. אל תכלול דעות אישיות.
התשובה שלך חייבת להיות טקסט בלבד.
`;
const googleSearchSystemInstruction_en = `
You are a research assistant. Your task is to provide a comprehensive, fact-based summary for the user's query, based on Google search results.
The summary should be objective, clear, and well-written in English. Do not include personal opinions.
Your response must be text only.
`;

export async function getGoogleGroundedResponse(
    question: string,
    language: 'he' | 'en'
): Promise<GoogleGroundedResult> {
    const isHebrew = language === 'he';
    const systemInstruction = isHebrew ? googleSearchSystemInstruction_he : googleSearchSystemInstruction_en;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: question,
        config: {
            systemInstruction,
            tools: [{ googleSearch: {} }],
        }
    });
    
    const summary = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks.filter((c: any): c is WebSource => !!c.web);
    
    if (!summary.trim()) {
        return { summary: '', shortSummary: '', sources };
    }

    const shortSummarySystemInstruction = isHebrew
        ? 'תפקידך לסכם את הטקסט הבא למשפט אחד או שניים. היה תמציתי וברור.'
        : 'Your task is to summarize the following text into one or two sentences. Be concise and clear.';

    const shortSummaryResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Please summarize this text concisely: """${summary}"""`,
        config: {
            systemInstruction: shortSummarySystemInstruction,
        }
    });
    const shortSummary = shortSummaryResponse.text;

    return { summary, shortSummary, sources };
}

export function createRabbiChatSession(history?: { role: 'user' | 'model'; parts: { text: string }[] }[]): Chat {
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: rabbiChatSystemInstruction_he,
        },
        history,
    });
    return chat;
}