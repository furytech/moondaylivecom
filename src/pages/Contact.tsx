import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import GlassmorphismCard from "@/components/GlassmorphismCard";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, CheckCircle } from "lucide-react";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <PageLayout>
        <div className="max-w-md w-full mx-auto animate-fade-up">
          <GlassmorphismCard className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full border border-primary/30 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-3xl text-gold-gradient tracking-[0.06em] mb-4">
              Message Received
            </h1>
            <p className="font-serif text-lg text-cream-muted/80 mb-6">
              Thank you for reaching out. We'll respond within 24-48 hours under the next moon cycle.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setName("");
                setEmail("");
                setMessage("");
              }}
              className="font-serif text-base text-cream-muted/70 hover:text-primary transition-colors"
            >
              ← Send another message
            </button>
          </GlassmorphismCard>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-lg w-full mx-auto">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-up">
          <p className="font-serif text-sm text-primary/60 uppercase tracking-[0.2em] mb-4">
            Direct Inquiry
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-gold-gradient tracking-[0.06em] mb-4">
            Contact Us
          </h1>
          <p className="font-serif text-lg text-cream-muted/70">
            We welcome all questions, collaborations, and cosmic conversations.
          </p>
        </div>

        {/* Contact Form */}
        <GlassmorphismCard className="animate-fade-up stagger-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <label className="font-display text-sm text-cream-muted/80 uppercase tracking-widest">
                Your Name
              </label>
              <Input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-navy-medium/50 border-primary/20 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 h-14 font-serif text-base rounded-xl"
              />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="font-display text-sm text-cream-muted/80 uppercase tracking-widest">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-navy-medium/50 border-primary/20 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 h-14 font-serif text-base rounded-xl"
              />
            </div>

            {/* Message Field */}
            <div className="space-y-2">
              <label className="font-display text-sm text-cream-muted/80 uppercase tracking-widest">
                Your Message
              </label>
              <Textarea
                placeholder="Share your thoughts, questions, or inquiries..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                className="bg-navy-medium/50 border-primary/20 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 font-serif text-base rounded-xl resize-none"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 font-display text-sm tracking-[0.15em] uppercase border border-primary/40 bg-transparent hover:bg-primary/10 text-primary rounded-xl transition-all duration-500"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  Sending...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Send Message
                </span>
              )}
            </Button>
          </form>
        </GlassmorphismCard>

        {/* Decorative element */}
        <div className="mt-10 flex items-center justify-center gap-4 animate-fade-up stagger-2">
          <div className="w-16 h-px bg-gradient-to-r from-transparent to-primary/30" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
          <div className="w-16 h-px bg-gradient-to-l from-transparent to-primary/30" />
        </div>
      </div>
    </PageLayout>
  );
};

export default Contact;
