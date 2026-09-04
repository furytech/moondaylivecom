import { Link } from "react-router-dom";
import { Clock, Calendar } from "lucide-react";
import { BlogPost, categoryPath, resolveSignImage } from "@/lib/blog/posts";

const formatDateTime = (iso: string) =>
  `${new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · ${new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" })}`;

const BlogCard = ({ post, featured = false }: { post: BlogPost; featured?: boolean }) => {
  const href = `/blog/${categoryPath(post.category)}/${post.slug}`;
  const signImage = resolveSignImage(post);

  return (
    <Link
      to={href}
      className={`group block relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 backdrop-blur-md transition-all duration-500 hover:border-primary/50 hover:shadow-[0_0_50px_-15px_hsl(var(--primary)/0.35)] hover:-translate-y-0.5 ${
        featured ? "md:col-span-2" : ""
      }`}
    >
      <div
        className={`relative w-full ${featured ? "h-56 md:h-72" : "h-40"} bg-gradient-to-br from-primary/25 via-navy-medium to-navy-deep overflow-hidden flex items-center justify-center`}
      >
        {signImage ? (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,hsl(var(--primary)/0.18),transparent_55%)]" />
            <img
              src={signImage}
              alt={`${post.zodiacSignTag || "Constellation"} constellation card`}
              className="relative z-10 h-full w-full object-contain p-3 md:p-4"
            />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.35),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,hsl(var(--gold-medium)/0.15),transparent_50%)]" />
          </>
        )}
        {/* Bottom fade into card body (#161622) for seamless blend */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-[#161622]" />
      </div>

      <div className={`p-5 md:p-6 ${featured ? "md:p-8" : ""}`}>
        <h3
          className={`font-display tracking-wide text-foreground group-hover:text-primary transition-colors ${
            featured ? "text-2xl md:text-3xl leading-snug" : "text-lg md:text-xl leading-snug"
          }`}
        >
          {post.title}
        </h3>
        <p className="mt-3 text-xs tracking-wider uppercase text-cream-muted/70">
          {formatDateTime(post.date)}
        </p>
        <p className="mt-3 text-sm md:text-base text-cream-muted line-clamp-3">{post.excerpt}</p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-cream-muted/80">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {post.category} · {post.readMinutes} min
          </span>
        </div>

        {post.keywords.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {post.keywords.slice(0, 4).map((k) => (
              <span
                key={k}
                className="inline-flex items-center rounded-full border border-border/50 bg-background/50 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-cream-muted/90"
              >
                {k}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

export default BlogCard;
