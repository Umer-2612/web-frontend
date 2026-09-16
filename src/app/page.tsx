import Link from "next/link";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";

const MODES = [
  {
    title: "Live video, the whole time",
    desc: "Hiring manager and candidate join one call. It stays connected no matter what else is happening.",
  },
  {
    title: "Switch to a DSA round",
    desc: "A shared, real-time code editor opens for both of you. No setup, no separate link.",
  },
  {
    title: "Or a VSCode test",
    desc: "A real, isolated VS Code environment with a live preview, running in the browser.",
  },
  {
    title: "One link, no account for the candidate",
    desc: "They open the invite, join the call, and follow wherever the hiring manager switches to.",
  },
];

const HomePage = () => (
  <main className="flex min-h-screen flex-col">
    <div className="flex justify-end p-4">
      <ThemeSwitcher />
    </div>

    <div className="flex flex-1 items-center justify-center px-4 pb-16">
      <div className="w-full max-w-lg">
        <span className="text-muted-foreground text-[11px] font-semibold tracking-[0.2em] uppercase">
          Live technical interviews
        </span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Interview Platform</h1>
        <p className="text-muted-foreground mt-1 text-base font-medium">
          One room. Every round.
        </p>

        <div className="my-8 space-y-1">
          <div className="bg-border mb-4 h-px" />
          {MODES.map((mode, i) => (
            <div key={mode.title} className="flex gap-3 py-2">
              <span className="bg-primary text-primary-foreground mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold">{mode.title}</p>
                <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">{mode.desc}</p>
              </div>
            </div>
          ))}
          <div className="bg-border mt-4 h-px" />
        </div>

        <div className="space-y-3">
          <Button asChild size="lg" className="w-full">
            <Link href="/login">Sign in</Link>
          </Button>
          <p className="text-muted-foreground text-center text-xs">
            Already have an invite link? Open it directly instead.
          </p>
        </div>
      </div>
    </div>
  </main>
);

export default HomePage;
