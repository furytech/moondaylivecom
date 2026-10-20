import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import BirthdayEmailStep from "@/components/BirthdayEmailStep";
import { seoProps } from "@/lib/seo";

const FindMoonSign = () => (
  <div className="min-h-screen bg-background text-foreground font-sans relative overflow-x-hidden flex flex-col">
    <SEO {...seoProps("/find-my-moon-sign")} />
    <Navigation />

    <main className="relative z-10 flex-1 flex items-start justify-center px-4 sm:px-6 pt-[68px] pb-16">
      <div className="max-w-md w-full">
        <div className="text-center mb-6 animate-fade-up">
          <div className="relative inline-block mb-4">
            <img
              src="/assets/MoondayLive-Logo.png"
              alt="Moonday Live logo"
              className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border border-lilac/30 shadow-[0_0_50px_-10px_hsl(var(--lilac)/0.5)]"
            />
          </div>
          <p className="text-lilac text-xs tracking-[0.3em] uppercase mb-2">Free · Birthday only</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-2">
            Find your Moon sign
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Add your birthday and email. Your Moon sign appears right away.
          </p>
        </div>

        <div className="p-5 sm:p-8 rounded-3xl border border-lilac/20 bg-card/50 backdrop-blur-xl shadow-[0_0_80px_-20px_hsl(var(--lilac)/0.4)] animate-fade-up stagger-1">
          <BirthdayEmailStep />
        </div>
      </div>
    </main>

    <Footer />
  </div>
);

export default FindMoonSign;
