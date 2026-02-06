// Art Deco Sign Detail Panel with Tabbed Content
import { useState } from "react";
import { X } from "lucide-react";
import { ZodiacDeepContent } from "@/lib/zodiacDeepContent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface SignDetailPanelProps {
  content: ZodiacDeepContent;
  onClose: () => void;
}

export function SignDetailPanel({ content, onClose }: SignDetailPanelProps) {
  const [activeTab, setActiveTab] = useState("essence");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/95 backdrop-blur-xl animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-b from-navy-dark to-background border border-primary/20 overflow-hidden animate-scale-in">
        {/* Art Deco corner accents */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-primary/50" />
        <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-primary/50" />
        <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-primary/50" />
        <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-primary/50" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <ScrollArea className="h-[90vh]">
          <div className="p-6 md:p-10 pt-12 flex flex-col gap-6">
            {/* Header - isolated block */}
            <header className="text-center flex flex-col items-center gap-4">
              <span className="text-5xl md:text-7xl text-primary/80 font-display">
                {content.symbol}
              </span>
              <h2 className="font-display text-3xl md:text-5xl text-gold-gradient tracking-[0.15em] uppercase">
                {content.sign}
              </h2>
              <div className="flex items-center justify-center gap-4 text-muted-foreground">
                <span className="font-serif tracking-widest uppercase text-sm">{content.element}</span>
                <span className="w-1 h-1 rounded-full bg-primary/50" />
                <span className="font-serif tracking-widest uppercase text-sm">Ruled by {content.ruling}</span>
              </div>
              
              {/* Art Deco divider */}
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="w-16 md:w-24 h-px bg-gradient-to-r from-transparent to-primary/50" />
                <div className="w-2 h-2 rotate-45 border border-primary/50" />
                <div className="w-16 md:w-24 h-px bg-gradient-to-l from-transparent to-primary/50" />
              </div>
            </header>

            {/* Tabbed Content - separate block */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col gap-6">
              {/* Tabs navigation - stacked on mobile */}
              <TabsList className="w-full h-auto flex flex-col md:flex-row md:flex-wrap justify-center items-stretch md:items-center gap-3 bg-transparent p-0">
                {[
                  { value: "essence", label: "The Essence" },
                  { value: "shadow", label: "The Shadow" },
                  { value: "ritual", label: "Sacred Ritual" },
                  { value: "affinity", label: "Elemental Affinity" },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      "w-full md:w-auto px-6 py-4 font-display text-xs md:text-sm tracking-[0.15em] uppercase",
                      "border border-primary/20 bg-background/50",
                      "data-[state=active]:bg-primary/10 data-[state=active]:border-primary/50 data-[state=active]:text-primary",
                      "hover:border-primary/40 transition-all duration-300",
                      "min-h-[48px]"
                    )}
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* The Essence */}
              <TabsContent value="essence" className="animate-fade-up">
                <div className="space-y-8">
                  <div className="text-center">
                    <h3 className="font-display text-lg md:text-xl text-primary tracking-[0.2em] uppercase mb-4">
                      {content.essence.title}
                    </h3>
                    <p className="font-serif text-lg md:text-xl text-cream-muted leading-relaxed italic max-w-2xl mx-auto">
                      {content.essence.poetry}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 mt-10">
                    <div className="border border-primary/10 p-6">
                      <h4 className="font-display text-xs tracking-[0.2em] uppercase text-primary/60 mb-4">
                        Core Wounds
                      </h4>
                      <ul className="space-y-3">
                        {content.essence.coreWounds.map((wound, i) => (
                          <li key={i} className="font-serif text-cream-muted flex gap-3">
                            <span className="text-primary/40 mt-1">◆</span>
                            <span>{wound}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="border border-primary/10 p-6">
                      <h4 className="font-display text-xs tracking-[0.2em] uppercase text-primary/60 mb-4">
                        Soul Gifts
                      </h4>
                      <ul className="space-y-3">
                        {content.essence.soulGifts.map((gift, i) => (
                          <li key={i} className="font-serif text-cream-muted flex gap-3">
                            <span className="text-primary/60 mt-1">◆</span>
                            <span>{gift}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* The Shadow */}
              <TabsContent value="shadow" className="animate-fade-up">
                <div className="space-y-8">
                  <div className="text-center">
                    <h3 className="font-display text-lg md:text-xl text-primary tracking-[0.2em] uppercase mb-4">
                      {content.shadow.title}
                    </h3>
                    <p className="font-serif text-lg md:text-xl text-cream-muted leading-relaxed max-w-2xl mx-auto">
                      {content.shadow.rawTruth}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6 mt-10">
                    <div className="border border-primary/10 p-5">
                      <h4 className="font-display text-xs tracking-[0.2em] uppercase text-primary/60 mb-4 text-center">
                        Triggers
                      </h4>
                      <ul className="space-y-2">
                        {content.shadow.triggers.map((trigger, i) => (
                          <li key={i} className="font-serif text-sm text-cream-muted">
                            • {trigger}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="border border-primary/10 p-5">
                      <h4 className="font-display text-xs tracking-[0.2em] uppercase text-primary/60 mb-4 text-center">
                        Hidden Fears
                      </h4>
                      <ul className="space-y-2">
                        {content.shadow.hiddenFears.map((fear, i) => (
                          <li key={i} className="font-serif text-sm text-cream-muted">
                            • {fear}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="border border-primary/10 p-5">
                      <h4 className="font-display text-xs tracking-[0.2em] uppercase text-primary/60 mb-4 text-center">
                        Destructive Patterns
                      </h4>
                      <ul className="space-y-2">
                        {content.shadow.destructivePatterns.map((pattern, i) => (
                          <li key={i} className="font-serif text-sm text-cream-muted">
                            • {pattern}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Sacred Ritual */}
              <TabsContent value="ritual" className="animate-fade-up">
                <div className="space-y-8">
                  <div className="text-center">
                    <h3 className="font-display text-lg md:text-xl text-primary tracking-[0.2em] uppercase mb-2">
                      {content.ritual.title}
                    </h3>
                    <p className="font-serif text-muted-foreground tracking-wide uppercase text-sm">
                      {content.ritual.element} Element Practice
                    </p>
                    <p className="font-serif text-cream-muted mt-4 max-w-xl mx-auto">
                      {content.ritual.practice}
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="border border-primary/10 p-6">
                      <h4 className="font-display text-xs tracking-[0.2em] uppercase text-primary/60 mb-3">
                        Optimal Timing
                      </h4>
                      <p className="font-serif text-cream-muted">{content.ritual.timing}</p>

                      <h4 className="font-display text-xs tracking-[0.2em] uppercase text-primary/60 mb-3 mt-6">
                        Sacred Tools
                      </h4>
                      <ul className="space-y-2">
                        {content.ritual.tools.map((tool, i) => (
                          <li key={i} className="font-serif text-cream-muted flex gap-2">
                            <span className="text-primary/40">◇</span>
                            {tool}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="border border-primary/10 p-6">
                      <h4 className="font-display text-xs tracking-[0.2em] uppercase text-primary/60 mb-4">
                        The Practice
                      </h4>
                      <ol className="space-y-3">
                        {content.ritual.steps.map((step, i) => (
                          <li key={i} className="font-serif text-cream-muted flex gap-3">
                            <span className="text-primary/60 font-display text-sm">{i + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Elemental Affinity */}
              <TabsContent value="affinity" className="animate-fade-up">
                <div className="space-y-8">
                  <div className="text-center mb-8">
                    <p className="font-serif text-muted-foreground">
                      Sacred Number: <span className="text-primary">{content.affinity.sacredNumber}</span>
                      <span className="mx-4">•</span>
                      Lunar Phase: <span className="text-primary">{content.affinity.moonPhase}</span>
                    </p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Stones */}
                    <div className="border border-primary/10 p-6">
                      <h4 className="font-display text-xs tracking-[0.2em] uppercase text-primary/60 mb-4 text-center">
                        Sacred Stones
                      </h4>
                      <ul className="space-y-4">
                        {content.affinity.stones.map((stone, i) => (
                          <li key={i}>
                            <p className="font-display text-sm text-foreground tracking-wide">{stone.name}</p>
                            <p className="font-serif text-xs text-muted-foreground mt-1">{stone.purpose}</p>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Botanicals */}
                    <div className="border border-primary/10 p-6">
                      <h4 className="font-display text-xs tracking-[0.2em] uppercase text-primary/60 mb-4 text-center">
                        Botanicals
                      </h4>
                      <ul className="space-y-4">
                        {content.affinity.botanicals.map((plant, i) => (
                          <li key={i}>
                            <p className="font-display text-sm text-foreground tracking-wide">{plant.name}</p>
                            <p className="font-serif text-xs text-muted-foreground mt-1">{plant.use}</p>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Colors */}
                    <div className="border border-primary/10 p-6">
                      <h4 className="font-display text-xs tracking-[0.2em] uppercase text-primary/60 mb-4 text-center">
                        Sacred Colors
                      </h4>
                      <ul className="space-y-4">
                        {content.affinity.colors.map((color, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <div 
                              className="w-6 h-6 rounded-sm border border-primary/20 flex-shrink-0 mt-0.5"
                              style={{ backgroundColor: color.hex }}
                            />
                            <div>
                              <p className="font-display text-sm text-foreground tracking-wide">{color.name}</p>
                              <p className="font-serif text-xs text-muted-foreground mt-1">{color.meaning}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
