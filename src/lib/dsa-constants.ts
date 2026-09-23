/**
 * Languages offered in the DSA round editor. `judge0Id` maps to language_id
 * on the self-hosted Judge0 instance judge-service proxies to (see
 * https://ce.judge0.com/languages).
 */
export interface DsaLanguage {
  id: string;
  name: string;
  monaco: string;
  judge0Id: number;
}

export const DSA_LANGUAGES: DsaLanguage[] = [
  { id: "javascript", name: "JavaScript", monaco: "javascript", judge0Id: 63 },
  { id: "python", name: "Python", monaco: "python", judge0Id: 71 },
  { id: "java", name: "Java", monaco: "java", judge0Id: 62 },
  { id: "cpp", name: "C++", monaco: "cpp", judge0Id: 54 },
  { id: "c", name: "C", monaco: "c", judge0Id: 50 },
  { id: "go", name: "Go", monaco: "go", judge0Id: 60 },
];

export function getDsaLanguage(id: string): DsaLanguage {
  return DSA_LANGUAGES.find((lang) => lang.id === id) ?? DSA_LANGUAGES[0]!;
}

export const DSA_EDITOR_OPTIONS = {
  fontSize: 14,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
  wordWrap: "on" as const,
  padding: { top: 16 },
};
