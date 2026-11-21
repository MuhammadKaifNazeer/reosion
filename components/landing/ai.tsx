export function LandingAI() {
  return (
    <section id="ai" className="border-b border-border">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Optional AI, your API key.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              &ldquo;Make the title slide in from the left.&rdquo; The
              assistant reads your code, project settings and runtime
              errors, then proposes a patch as a diff. Accept, reject, keep
              typing. The product never depends on it — and it works with
              OpenAI, Anthropic, Gemini or an OpenRouter model of your
              choice.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 font-mono text-xs leading-6">
            <p className="text-muted-foreground">prompt</p>
            <p className="text-foreground">
              &ldquo;Slide the title in from the left.&rdquo;
            </p>
            <div className="my-3 border-t border-border" />
            <p className="text-muted-foreground">proposed diff</p>
            <pre className="tracking-tight">
              <code className="block text-foreground">
                <span className="text-destructive">- initial=&#123;&#123; opacity: 0 &#125;&#125;</span>
                {"\n"}
                <span className="text-brand">+ initial=&#123;&#123; opacity: 0, x: -40 &#125;&#125;</span>
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}