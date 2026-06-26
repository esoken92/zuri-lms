import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { MODULE_LIST } from "@/platform/modules/registry";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
        <span className="text-lg font-semibold tracking-tight">Zuri</span>
        <div className="flex items-center gap-2">
          <Show when="signed-out">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">Get started</Button>
            </Link>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard">
              <Button size="sm">Open dashboard</Button>
            </Link>
          </Show>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight">
          One platform for your depot, fleet and logistics operations.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-neutral-600">
          Zuri hosts a growing suite of modules. Your organization switches on
          exactly what it needs &mdash; nothing more.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {MODULE_LIST.map((m) => (
            <div key={m.id} className="rounded-xl border border-neutral-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{m.name}</h3>
                {!m.available && (
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                    Coming soon
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-neutral-600">{m.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
