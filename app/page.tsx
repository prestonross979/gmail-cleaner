import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { isMockMode } from "@/lib/env";
import { ConnectGmailButton } from "@/components/auth/ConnectGmailButton";

const FEATURES = [
  {
    title: "Connect Gmail securely",
    description: "Sign in with Google OAuth. We never see or ask for your password, and secrets stay server-side.",
  },
  {
    title: "Review senders",
    description: "See exactly who's filling up your inbox, grouped by sender and domain.",
  },
  {
    title: "See email counts",
    description: "Every sender shows how many emails they've sent and when they last emailed you.",
  },
  {
    title: "Archive or trash in bulk",
    description: "Clean up one sender or many at once, with a confirmation step before anything moves.",
  },
];

function authErrorMessage(code: string | undefined): string | null {
  switch (code) {
    case "AccessDenied":
      return "Sign-in was cancelled — no problem, connect whenever you're ready.";
    case "OAuthAccountNotLinked":
      return "That Google account is already linked differently. Try signing in again.";
    case undefined:
      return null;
    default:
      return "We couldn't complete sign-in. Please try connecting again.";
  }
}

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const mockMode = isMockMode();
  const { error } = await searchParams;

  if (!mockMode) {
    const session = await auth();
    if (session && !session.error) {
      redirect("/dashboard");
    }
  }

  const bannerMessage = authErrorMessage(error);

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-6 sm:px-8">
        <span className="text-lg font-semibold tracking-tight">Inbox Cleaner</span>
        {mockMode && (
          <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">Mock data mode</span>
        )}
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-5 pb-24 sm:px-8">
        <section className="flex flex-col items-start gap-6 pt-8 sm:pt-16">
          {bannerMessage && (
            <div className="w-full max-w-xl rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
              {bannerMessage}
            </div>
          )}
          <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Clean up your Gmail inbox in minutes, not hours.
          </h1>
          <p className="max-w-xl text-lg text-foreground/70">
            Inbox Cleaner scans your mailbox, groups emails by sender, and lets you archive or trash entire senders in
            bulk — safely, and always recoverable.
          </p>
          <ConnectGmailButton mockMode={mockMode} />
          <p className="text-sm text-foreground/50">
            Emails moved to Trash aren&apos;t deleted immediately — you can still recover them from Gmail&apos;s Trash folder.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-border">
              <h2 className="text-base font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm text-foreground/65">{feature.description}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl bg-surface-muted p-6 sm:p-8">
          <h2 className="text-lg font-semibold">Built with privacy in mind</h2>
          <ul className="mt-4 space-y-2 text-sm text-foreground/70">
            <li>• Google OAuth only — your Gmail password never touches this app.</li>
            <li>• Only the message headers needed to group and count emails are read — full message bodies are never stored.</li>
            <li>• Archiving and moving to Trash are reversible; nothing is permanently deleted.</li>
            <li>• Your OAuth tokens are kept server-side and are never logged.</li>
          </ul>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-5 py-8 text-center text-xs text-foreground/40 sm:px-8">
        Inbox Cleaner works great on desktop and mobile Safari — add it to your iPhone home screen for quick access.
      </footer>
    </div>
  );
}
