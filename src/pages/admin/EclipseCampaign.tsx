import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Telescope,
  Waves,
  HandHeart,
  Copy,
  Check,
  Newspaper,
  MessagesSquare,
  Clapperboard,
  LayoutDashboard,
} from "lucide-react";
import PageLayout from "@/components/PageLayout";
import SEO from "@/components/SEO";
import EclipseBanner from "@/components/campaign/EclipseBanner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  dashboardLenses,
  eclipseFacts,
  redditPost,
  substackEssay,
  videoStoryboard,
} from "@/content/campaigns/eclipseAug2026";

const lensIcons = {
  scientific: Telescope,
  atmospheric: Waves,
  experiential: HandHeart,
} as const;

const CopyButton = ({ text, label }: { text: string; label: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast({ title: `${label} copied` });
        window.setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? (
        <Check className="mr-2 h-4 w-4" strokeWidth={1.5} />
      ) : (
        <Copy className="mr-2 h-4 w-4" strokeWidth={1.5} />
      )}
      Copy {label}
    </Button>
  );
};

const FactRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1 border-b border-primary/10 py-3 last:border-0 sm:flex-row sm:gap-6">
    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:w-52">
      {label}
    </span>
    <span className="text-sm leading-relaxed text-foreground/90">{value}</span>
  </div>
);

const EclipseCampaign = () => {
  const navigate = useNavigate();

  const redditFull = `${redditPost.title}\n\n${redditPost.body}`;
  const scriptFull = [
    videoStoryboard.title,
    videoStoryboard.platforms,
    "",
    ...videoStoryboard.beats.map(
      (b) => `${b.time}\nVO: ${b.vo}\nVISUAL: ${b.visual}\n`
    ),
    `NOTES: ${videoStoryboard.notes}`,
  ].join("\n");

  return (
    <PageLayout showFooter={false} className="sov-shell">
      <SEO
        title="Eclipse Campaign Desk | Moonday Live Admin"
        description="Multi-channel deployment desk for the August 27-28, 2026 deep partial lunar eclipse in Pisces."
        noindex
      />

      <div className="relative z-10 w-full max-w-5xl space-y-8 py-6">
        <header className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">
            Campaign desk
          </p>
          <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            August 27 to 28, 2026 Pisces Lunar Eclipse
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {eclipseFacts.obscuration} · peak {eclipseFacts.peakUtc}
          </p>
        </header>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2 gap-1 sm:grid-cols-4 h-auto">
            <TabsTrigger value="dashboard" className="gap-2 py-2 text-xs">
              <LayoutDashboard className="h-4 w-4" strokeWidth={1.5} />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="substack" className="gap-2 py-2 text-xs">
              <Newspaper className="h-4 w-4" strokeWidth={1.5} />
              Substack
            </TabsTrigger>
            <TabsTrigger value="reddit" className="gap-2 py-2 text-xs">
              <MessagesSquare className="h-4 w-4" strokeWidth={1.5} />
              Reddit
            </TabsTrigger>
            <TabsTrigger value="video" className="gap-2 py-2 text-xs">
              <Clapperboard className="h-4 w-4" strokeWidth={1.5} />
              Short-form
            </TabsTrigger>
          </TabsList>

          {/* 1. Dashboard overlay */}
          <TabsContent value="dashboard" className="mt-6 space-y-6">
            <EclipseBanner onCta={() => navigate("/blueprint")} />

            <div className="sov-card sov-card--wide">
              <h2 className="mb-2 text-lg font-semibold text-foreground">
                Ephemeris baseline
              </h2>
              <FactRow label="Tropical position" value={eclipseFacts.moonLongitude} />
              <FactRow label="Geocentric velocity" value={eclipseFacts.moonVelocity} />
              <FactRow label="Opposition" value={eclipseFacts.sunLongitude} />
              <FactRow label="Square" value={eclipseFacts.square} />
              <FactRow label="Lunar mansion" value={eclipseFacts.mansion} />
              <FactRow label="Sidereal" value={eclipseFacts.sidereal} />
              <FactRow label="Draconic" value={eclipseFacts.draconic} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {dashboardLenses.map((lens) => {
                const Icon = lensIcons[lens.key];
                return (
                  <div key={lens.key} className="sov-card">
                    <div className="mb-4 flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                      <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
                        {lens.label}
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {lens.points.map((p) => (
                        <div key={p.label}>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/80">
                            {p.label}
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-foreground/85">
                            {p.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* 2. Substack */}
          <TabsContent value="substack" className="mt-6">
            <div className="sov-card sov-card--wide">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  {substackEssay.title}
                </h2>
                <CopyButton text={substackEssay.body} label="essay" />
              </div>
              <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-foreground/85">
                {substackEssay.body}
              </pre>
            </div>
          </TabsContent>

          {/* 3. Reddit */}
          <TabsContent value="reddit" className="mt-6">
            <div className="sov-card sov-card--wide">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                    {redditPost.subreddits.join(" · ")}
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-foreground">
                    {redditPost.title}
                  </h2>
                </div>
                <CopyButton text={redditFull} label="thread" />
              </div>
              <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-foreground/85">
                {redditPost.body}
              </pre>
            </div>
          </TabsContent>

          {/* 4. Short-form video */}
          <TabsContent value="video" className="mt-6 space-y-4">
            <div className="sov-card sov-card--wide">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {videoStoryboard.title}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {videoStoryboard.platforms}
                  </p>
                </div>
                <CopyButton text={scriptFull} label="script" />
              </div>

              <div className="space-y-4">
                {videoStoryboard.beats.map((beat) => (
                  <div
                    key={beat.time}
                    className="rounded-xl border border-primary/15 bg-background/30 p-4"
                  >
                    <p className="font-mono text-xs tracking-wide text-primary">
                      {beat.time}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        VO{" "}
                      </span>
                      {beat.vo}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/75">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Visual{" "}
                      </span>
                      {beat.visual}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-5 border-t border-primary/10 pt-4 text-sm leading-relaxed text-muted-foreground">
                {videoStoryboard.notes}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default EclipseCampaign;
