import { cn } from "@/lib/utils";

interface RichTextContentProps {
  html: string;
  className?: string;
}

export function RichTextContent({ html, className }: RichTextContentProps) {
  return (
    <div
      className={cn("rich-text-content text-sm leading-relaxed text-zinc-600 dark:text-zinc-400", className)}
      // The only author of this HTML is the authenticated hiring manager who
      // wrote it, rendered back to their own company or the super admin.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
