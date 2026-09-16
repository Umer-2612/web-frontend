import Link from "next/link";

import { Button } from "@/components/ui/button";

const HomePage = () => (
  <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
    <h1 className="text-3xl font-bold">Interview Platform</h1>
    <p className="text-muted-foreground max-w-sm text-sm">
      Sign in if you already have an account, or open the invite link you were sent.
    </p>
    <Button asChild>
      <Link href="/login">Sign in</Link>
    </Button>
  </main>
);

export default HomePage;
