import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import API from "../api";
import {
  Quote,
  Sparkles,
  Copy,
  Share2,
  Heart,
  RefreshCw,
  Search,
  Home,
  Clock,
  Star,
  Info,
  Trash2,
  ChevronDown,
  X,
  Check,
  BookOpen,
  Zap,
  TrendingUp,
  Award,
  Filter,
  SortAsc,
  Menu,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type Category =
  | "Philosophy"
  | "Wisdom"
  | "Motivation"
  | "Creativity"
  | "Success"
  | "Life"
  | "Science"
  | "Art";

interface QuoteData {
  id: number;
  text: string;
  author: string;
  category: Category;
}

interface HistoryEntry extends QuoteData {
  timestamp: Date;
  isFavorite: boolean;
}

type Page = "home" | "history" | "favorites" | "about";
type SortOption = "newest" | "oldest" | "favorites";


const CATEGORY_COLORS: Record<Category, string> = {
  Philosophy: "from-violet-500/20 to-purple-500/20 text-violet-300 border-violet-500/30",
  Wisdom: "from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30",
  Motivation: "from-rose-500/20 to-pink-500/20 text-rose-300 border-rose-500/30",
  Creativity: "from-cyan-500/20 to-teal-500/20 text-cyan-300 border-cyan-500/30",
  Success: "from-emerald-500/20 to-green-500/20 text-emerald-300 border-emerald-500/30",
  Life: "from-blue-500/20 to-indigo-500/20 text-blue-300 border-blue-500/30",
  Science: "from-sky-500/20 to-cyan-500/20 text-sky-300 border-sky-500/30",
  Art: "from-fuchsia-500/20 to-pink-500/20 text-fuchsia-300 border-fuchsia-500/30",
};

// ── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedNumber({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const start = prev.current;
    const end = value;
    if (start === end) return;
    const duration = 800;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
      else prev.current = end;
    };

    requestAnimationFrame(tick);
  }, [value]);

  return <span>{displayed}</span>;
}

// ── Toast ────────────────────────────────────────────────────────────────────

interface ToastMessage { id: number; message: string; type: "success" | "info" | "error" }

function ToastContainer({ toasts, dismiss }: { toasts: ToastMessage[]; dismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl backdrop-blur-xl border shadow-2xl"
            style={{
              background: "rgba(18,20,42,0.92)",
              borderColor: t.type === "success" ? "rgba(52,211,153,0.3)" : t.type === "error" ? "rgba(239,68,68,0.3)" : "rgba(124,58,237,0.3)",
            }}
          >
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${t.type === "success" ? "bg-emerald-400" : t.type === "error" ? "bg-red-400" : "bg-violet-400"}`} />
            <span className="text-sm text-white/90 font-medium">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="ml-1 text-white/40 hover:text-white/80 transition-colors">
              <X size={13} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ── Category Badge ───────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: Category }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r border backdrop-blur-sm ${CATEGORY_COLORS[category]}`}>
      {category}
    </span>
  );
}

// ── Loading Skeleton ─────────────────────────────────────────────────────────

function QuoteSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-5 w-24 rounded-full bg-white/10" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-full rounded bg-white/10" />
        <div className="h-4 w-11/12 rounded bg-white/10" />
        <div className="h-4 w-9/12 rounded bg-white/10" />
        <div className="h-4 w-10/12 rounded bg-white/10" />
      </div>
      <div className="pt-4 flex items-center gap-2">
        <div className="h-3 w-32 rounded bg-white/10" />
      </div>
    </div>
  );
}

// ── Stats Card ───────────────────────────────────────────────────────────────

function StatsCard({
  icon: Icon,
  label,
  value,
  color,
  delay,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value?: number;
  color: string;
  delay: number;
  onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border p-5 ${
        onClick ? "cursor-pointer" : ""
      }`}
      style={{
        background: "rgba(255,255,255,0.04)",
        borderColor: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${color}`} />

        <div>
              <p
                className="text-xs font-medium uppercase tracking-widest"
                style={{ color: "#8b8fa8" }}
              >
                {label}
              </p>

              {value !== undefined ? (
                <p
                  className="text-3xl font-bold text-white mt-1"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  <AnimatedNumber value={value} />
                </p>
              ) : (
                <p
                  className="text-sm mt-2"
                  style={{ color: "#a6accd" }}
                >
                  {label === "In History"
                    ? "View your recent quotes"
                    : "Quotes you love"}
                </p>
              )}
            </div>


    </motion.div>
  );
}

// ── Hero Quote Card ──────────────────────────────────────────────────────────

function HeroQuoteCard({
  quote, isLoading, isFavorite,
  onGenerate, onCopy, onShare, onFavorite,
}: {
  quote: QuoteData | null;
  isLoading: boolean;
  isFavorite: boolean;
  onGenerate: () => void;
  onShare: () => void;
  onFavorite: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative overflow-hidden rounded-3xl border p-8 md:p-10"
      style={{
        background: "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(6,182,212,0.06) 100%)",
        borderColor: "rgba(124,58,237,0.25)",
        backdropFilter: "blur(40px)",
        boxShadow: "0 0 60px rgba(124,58,237,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      {/* glow orbs */}
      <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
      <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #06b6d4, transparent)" }} />

      <div className="relative">
        {/* top row */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: "rgba(124,58,237,0.2)" }}>
              <Quote size={14} className="text-violet-300" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-violet-300/70">Quote of the Moment</span>
          </div>
          {quote && <CategoryBadge category={quote.category} />}
        </div>

        {/* quote body */}
        <div className="min-h-[140px] flex items-center">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
                <QuoteSkeleton />
              </motion.div>
            ) : quote ? (
              <motion.div
                key={quote.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4 }}
              >
                <blockquote className="text-xl md:text-2xl lg:text-3xl font-light leading-relaxed text-white/90 mb-6"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  <span className="text-5xl text-violet-400/40 font-bold leading-none select-none" aria-hidden>"</span>
                  {quote.text}
                  <span className="text-5xl text-violet-400/40 font-bold leading-none select-none" aria-hidden>"</span>
                </blockquote>
                <p className="text-base font-medium" style={{ color: "#8b8fa8", fontFamily: "'Inter', sans-serif" }}>
                  — {quote.author}
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* actions */}
        <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <ActionButton icon={<RefreshCw size={15} />} label="Generate" primary onClick={onGenerate} />
          <ActionButton icon={<Share2 size={15} />} label="Share" onClick={onShare} />
          <ActionButton
            icon={<Heart size={15} className={isFavorite ? "fill-rose-400 text-rose-400" : ""} />}
            label={isFavorite ? "Saved" : "Favorite"}
            onClick={onFavorite}
            active={isFavorite}
          />
        </div>
      </div>
    </motion.div>
  );
}

function ActionButton({
  icon, label, onClick, primary = false, active = false,
}: {
  icon: React.ReactNode; label: string; onClick?: () => void; primary?: boolean; active?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer"
      style={
        primary
          ? { background: "linear-gradient(135deg, #7c3aed, #6d28d9)", color: "#fff", boxShadow: "0 4px 20px rgba(124,58,237,0.35)" }
          : active
          ? { background: "rgba(244,63,94,0.15)", color: "#fb7185", border: "1px solid rgba(244,63,94,0.3)" }
          : { background: "rgba(255,255,255,0.06)", color: "#c4b5fd", border: "1px solid rgba(255,255,255,0.1)" }
      }
    >
      {icon}
      {label}
    </motion.button>
  );
}

// ── History Card ─────────────────────────────────────────────────────────────

function HistoryCard({ entry, onFavoriteToggle, onRemove }: {
  entry: HistoryEntry;
  onFavoriteToggle: (id: number) => void;
  onRemove: (id: number) => void;
}) {
  const timeAgo = formatTimeAgo(entry.timestamp);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative rounded-2xl border p-5 hover:border-violet-500/30 transition-all duration-200"
      style={{
        background: "rgba(255,255,255,0.03)",
        borderColor: "rgba(255,255,255,0.07)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <CategoryBadge category={entry.category} />
            <span className="text-xs" style={{ color: "#8b8fa8", fontFamily: "'DM Mono', monospace" }}>{timeAgo}</span>
          </div>
          <p className="text-sm text-white/80 leading-relaxed line-clamp-3 mb-2"
            style={{ fontFamily: "'Inter', sans-serif" }}>
            "{entry.text}"
          </p>
          <p className="text-xs font-medium" style={{ color: "#8b8fa8" }}>— {entry.author}</p>
        </div>
        <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => onFavoriteToggle(entry.id)}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/10">
            <Heart size={14} className={entry.isFavorite ? "fill-rose-400 text-rose-400" : "text-white/30"} />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => onRemove(entry.id)}
            className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10">
            <X size={14} className="text-white/30 hover:text-red-400" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Favorites Card ───────────────────────────────────────────────────────────

function FavoriteCard({ entry, onRemove }: { entry: HistoryEntry; onRemove: (id: number) => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.25 }}
      className="group relative rounded-2xl border p-6 flex flex-col gap-4 hover:border-rose-500/30 transition-all duration-200"
      style={{
        background: "linear-gradient(135deg, rgba(244,63,94,0.06) 0%, rgba(124,58,237,0.04) 100%)",
        borderColor: "rgba(255,255,255,0.07)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="flex items-center justify-between">
        <CategoryBadge category={entry.category} />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => onRemove(entry.id)}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/15 transition-all"
        >
          <Trash2 size={13} className="text-red-400" />
        </motion.button>
      </div>
      <p className="text-sm text-white/85 leading-relaxed flex-1" style={{ fontFamily: "'Inter', sans-serif" }}>
        "{entry.text}"
      </p>
      <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <p className="text-xs font-medium" style={{ color: "#8b8fa8" }}>— {entry.author}</p>
        <Heart size={13} className="fill-rose-400 text-rose-400" />
      </div>
    </motion.div>
  );
}

// ── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 gap-4 text-center"
    >
      <div className="p-4 rounded-2xl" style={{ background: "rgba(124,58,237,0.1)" }}>
        <Icon size={28} className="text-violet-400" />
      </div>
      <div>
        <p className="text-base font-semibold text-white/70 mb-1">{title}</p>
        <p className="text-sm" style={{ color: "#8b8fa8" }}>{description}</p>
      </div>
    </motion.div>
  );
}

// ── Search Bar ───────────────────────────────────────────────────────────────

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative flex-1">
      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search quotes…"}
        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white/80 placeholder-white/25 outline-none transition-all focus:ring-1"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          fontFamily: "'Inter', sans-serif",
        }}
      />
    </div>
  );
}

// ── Navbar ───────────────────────────────────────────────────────────────────

function Navbar({ current, onNav }: { current: Page; onNav: (p: Page) => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const links: { page: Page; label: string; icon: React.ElementType }[] = [
    { page: "home", label: "Home", icon: Home },
    { page: "history", label: "History", icon: Clock },
    { page: "favorites", label: "Favorites", icon: Star },
    { page: "about", label: "About", icon: Info },
  ];

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        background: "rgba(9,11,26,0.85)",
        borderColor: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(24px)",
      }}
    >
      <div className="max-w-5xl mx-auto px-4 md:px-6 flex items-center justify-between h-14">
        {/* brand */}
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg" style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="text-sm font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            QuoteForge
          </span>
        </div>

        {/* desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ page, label, icon: Icon }) => (
            <button
              key={page}
              onClick={() => onNav(page)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer"
              style={
                current === page
                  ? { background: "rgba(124,58,237,0.2)", color: "#c4b5fd" }
                  : { color: "#8b8fa8" }
              }
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </nav>

        {/* mobile hamburger */}
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60">
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t overflow-hidden"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {links.map(({ page, label, icon: Icon }) => (
                <button key={page} onClick={() => { onNav(page); setMobileOpen(false); }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left cursor-pointer"
                  style={current === page ? { background: "rgba(124,58,237,0.2)", color: "#c4b5fd" } : { color: "#8b8fa8" }}>
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ── Utility ──────────────────────────────────────────────────────────────────

function formatTimeAgo(date: Date): string {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

let _lastId = 0;
const nextId = () => ++_lastId;

// ── Pages ────────────────────────────────────────────────────────────────────

function HomePage({
  currentQuote, isLoading, history, favorites, copied, stats,
  onGenerate, onCopy, onShare, onFavorite,onOpenHistory,onOpenFavorites,onOpenCopiedStats,
}: {
  currentQuote: QuoteData | null;
  isLoading: boolean;
  history: HistoryEntry[];
  favorites: Set<number>;

  onGenerate: () => void;
  onShare: () => void;
  onFavorite: () => void;
  onOpenHistory: () => void;
  onOpenFavorites: () => void;
}) {
  return (
    <div className="space-y-8">
      {/* stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
        <StatsCard
          icon={Clock}
          label="In History"
          color="from-blue-500 to-indigo-600"
          delay={0.05}
          onClick={onOpenHistory}
        />
        <StatsCard
            icon={Heart}
            label="Favorites"
            color="from-rose-500 to-pink-600"
            delay={0.1}
            onClick={onOpenFavorites}
        />
      </div>

      {/* hero */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={15} className="text-violet-400" />
          <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#8b8fa8" }}>Today's Inspiration</h2>
        </div>
        <HeroQuoteCard
          quote={currentQuote}
          isLoading={isLoading}
          isFavorite={currentQuote ? favorites.has(currentQuote.id) : false}
          onGenerate={onGenerate}
          onCopy={onCopy}
          onShare={onShare}
          onFavorite={onFavorite}
        />
      </div>

      {/* mini recent */}
      {history.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#8b8fa8" }}>Recently Generated</p>
          <div className="grid md:grid-cols-2 gap-3">
            {history.slice(0, 2).map((e) => (
              <div key={e.id} className="rounded-xl border p-4"
                style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <CategoryBadge category={e.category} />
                </div>
                <p className="text-xs text-white/65 leading-relaxed line-clamp-2">{e.text}</p>
                <p className="text-xs mt-1.5" style={{ color: "#8b8fa8" }}>— {e.author}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryPage({
  history, favorites,
  onFavoriteToggle, onRemove, onClear,
}: {
  history: HistoryEntry[];
  favorites: Set<number>;
  onFavoriteToggle: (id: number) => void;
  onRemove: (id: number) => void;
  onClear: () => void;
}) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [filterCat, setFilterCat] = useState<Category | "All">("All");
  const [showFilters, setShowFilters] = useState(false);

  const categories: (Category | "All")[] = ["All", "Philosophy", "Wisdom", "Motivation", "Creativity", "Success", "Life", "Science", "Art"];

  const filtered = history
    .filter((e) => {
      const q = search.toLowerCase();
      const matchSearch = !q || e.text.toLowerCase().includes(q) || e.author.toLowerCase().includes(q);
      const matchCat = filterCat === "All" || e.category === filterCat;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      if (sort === "newest") return b.timestamp.getTime() - a.timestamp.getTime();
      if (sort === "oldest") return a.timestamp.getTime() - b.timestamp.getTime();
      return (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0);
    });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Quote History</h2>
          <p className="text-xs mt-0.5" style={{ color: "#8b8fa8" }}>{history.length} quotes generated</p>
        </div>
        {history.length > 0 && (
          <motion.button whileTap={{ scale: 0.95 }} onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            style={{ border: "1px solid rgba(239,68,68,0.2)" }}>
            <Trash2 size={12} />
            Clear All
          </motion.button>
        )}
      </div>

      {/* toolbar */}
      <div className="flex flex-wrap gap-2">
        <SearchBar value={search} onChange={setSearch} />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          style={{
            background: showFilters ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: showFilters ? "#c4b5fd" : "#8b8fa8",
          }}
        >
          <Filter size={14} />
        </button>
        <div className="relative">
          <SortAsc size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="pl-8 pr-8 py-2.5 rounded-xl text-xs font-medium outline-none appearance-none cursor-pointer"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#8b8fa8",
            }}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="favorites">Favorites</option>
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
        </div>
      </div>

      {/* category filter */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="flex flex-wrap gap-1.5 py-1">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setFilterCat(cat)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer"
                  style={filterCat === cat
                    ? { background: "rgba(124,58,237,0.2)", color: "#c4b5fd", border: "1px solid rgba(124,58,237,0.3)" }
                    : { background: "rgba(255,255,255,0.04)", color: "#8b8fa8", border: "1px solid rgba(255,255,255,0.07)" }
                  }
                >
                  {cat}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* list */}
      {history.length === 0 ? (
        <EmptyState icon={Clock} title="No history yet" description="Generate your first quote to see it here" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title="No matches" description="Try a different search term or category" />
      ) : (
        <motion.div className="space-y-3" layout>
          <AnimatePresence>
            {filtered.map((entry) => (
              <HistoryCard
                key={entry.id}
                entry={{ ...entry, isFavorite: favorites.has(entry.id) }}
                onFavoriteToggle={onFavoriteToggle}
                onRemove={onRemove}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

function FavoritesPage({ history, favorites, onRemove }: {
  history: HistoryEntry[];
  favorites: Set<number>;
  onRemove: (id: number) => void;
  
}) {
  const favEntries = history.filter((e) => favorites.has(e.id));
  console.log("History:", history);
  console.log("Favorites:", favorites);
  console.log("Fav Entries:", favEntries);
  const [search, setSearch] = useState("");

  const filtered = favEntries.filter((e) => {
    const q = search.toLowerCase();
    console.log(history);
    console.log(favorites);
    console.log(favEntries);
    return !q || e.text.toLowerCase().includes(q) || e.author.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Favorites</h2>
          <p className="text-xs mt-0.5" style={{ color: "#8b8fa8" }}>{favEntries.length} saved quotes</p>
        </div>
        <div className="p-2 rounded-xl" style={{ background: "rgba(244,63,94,0.1)" }}>
          <Heart size={16} className="fill-rose-400 text-rose-400" />
        </div>
      </div>

      {favEntries.length > 0 && <SearchBar value={search} onChange={setSearch} placeholder="Search favorites…" />}

      {favEntries.length === 0 ? (
        <EmptyState icon={Heart} title="No favorites yet" description="Tap the heart on any quote to save it here" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title="No matches" description="Try a different search term" />
      ) : (
        <motion.div layout className="grid sm:grid-cols-2 gap-4">
          <AnimatePresence>
            {filtered.map((entry) => (
              <FavoriteCard key={entry.id} entry={entry} onRemove={onRemove} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

function AboutPage() {
  const features = [
    { icon: Zap, title: "Instant Generation", desc: "Get a fresh quote from our curated library of 32 thoughtfully selected quotes across 8 categories." },
    { icon: Heart, title: "Save Favorites", desc: "Bookmark quotes that resonate with you and revisit them anytime in your personal favorites collection." },
    { icon: Clock, title: "Full History", desc: "Every quote you generate is saved to your session history with search, filter, and sort capabilities." },
    { icon: TrendingUp, title: "Live Stats", desc: "Track how many quotes you've discovered, copied, and saved with animated real-time counters." },
    { icon: Share2, title: "Share Anywhere", desc: "Copy or share any quote instantly via the native share API or clipboard." },
    { icon: Award, title: "8 Categories", desc: "From Philosophy to Science, quotes span Philosophy, Wisdom, Motivation, Creativity, Success, Life, Science, and Art." },
  ];

  return (
    <div className="space-y-8 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl" style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
            <BookOpen size={18} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>About QuoteForge</h2>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "#8b8fa8", fontFamily: "'Inter', sans-serif" }}>
          QuoteForge is a premium frontend quote discovery tool built for curious minds. Explore wisdom from history's greatest thinkers, creatives, and visionaries — entirely in-browser with no backend required.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 gap-3">
        {features.map(({ icon: Icon, title, desc }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-2xl border p-5"
            style={{
              background: "rgba(255,255,255,0.03)",
              borderColor: "rgba(255,255,255,0.07)",
            }}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-1.5 rounded-lg" style={{ background: "rgba(124,58,237,0.15)" }}>
                <Icon size={14} className="text-violet-400" />
              </div>
              <span className="text-sm font-semibold text-white/90">{title}</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "#8b8fa8" }}>{desc}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl border p-6 text-center"
        style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(6,182,212,0.05))",
          borderColor: "rgba(124,58,237,0.2)",
        }}
      >
        <p className="text-xs" style={{ color: "#8b8fa8" }}>Built with React · TypeScript · Tailwind CSS · Motion</p>
        <p className="text-xs mt-1" style={{ color: "#8b8fa8", fontFamily: "'DM Mono', monospace" }}>100% frontend · no data leaves your browser</p>
      </motion.div>
    </div>
  );
}

// ── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [favoriteQuotes, setFavoriteQuotes] = useState<HistoryEntry[]>([]);
  const [currentQuote, setCurrentQuote] = useState<QuoteData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  

  const toast = useCallback((message: string, type: ToastMessage["type"] = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  

const handleGenerate = useCallback(async () => {
        setIsLoading(true);

        try {
          const response = await API.get("/api/quote");

          const data = response.data;

          const quote = {
            id: data.id,
            text: data.quote,
            author: data.author,
            category: data.category,
          };

          setCurrentQuote(quote);

          await loadHistory();

          

        } catch (error) {
          console.error(error);
        }

        setIsLoading(false);
      }, []);

  const handleCopy = useCallback(async () => {
      if (!currentQuote) return;

      try {
        await navigator.clipboard.writeText(
          `"${currentQuote.text}" — ${currentQuote.author}`
        );

        setStats((s) => ({
          ...s,
          copied: s.copied + 1,
        }));

        toast("Copied!", "success");
      } catch (err) {
        console.error(err);
        toast("Unable to copy", "error");
      }
    }, [currentQuote, toast]);

  const handleShare = useCallback(() => {
    if (!currentQuote) return;
    const text = `"${currentQuote.text}" — ${currentQuote.author}`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).catch(() => {});
      toast("Copied for sharing!", "info");
    }
  }, [currentQuote, toast]);

 const handleFavorite = useCallback(async () => {
        if (!currentQuote) return;

        try {
          await API.post("/api/favorite", {
          quote: currentQuote.text,
          author: currentQuote.author,
          category: currentQuote.category,
      });

          await loadHistory();

          const response = await API.get("/api/favorites");

          const favs = new Set<number>(
            response.data.map((item: any) => item.id)
          );

          setFavorites(favs);

          
          toast("Added to favorites ❤️", "success");

        } catch (err) {
          console.error(err);
        }
      }, [currentQuote, toast]);

  const handleFavoriteToggle = useCallback(async (id: number) => {
      try {
        await API.post(`/api/favorite/${id}`);

        await loadHistory();

        const response = await API.get("/api/favorites");

            setFavorites(
                new Set(response.data.map((item:any)=>item.id))
            );

            setFavoriteQuotes(
                response.data.map((item:any)=>({
                    id:item.id,
                    text:item.quote,
                    author:item.author,
                    category:item.category,
                    timestamp:new Date(item.created_at),
                    isFavorite:item.favorite
                }))
            );

      } catch (err) {
        console.error(err);
      }
    }, []);

  const handleRemove = useCallback(async (id: number) => {
      try {
        await API.delete(`/api/history/${id}`);

        await loadHistory();

        const response = await API.get("/api/favorites");

        setFavorites(
          new Set(response.data.map((item: any) => item.id))
        );

        setFavoriteQuotes(
          response.data.map((item: any) => ({
            id: item.id,
            text: item.quote,
            author: item.author,
            category: item.category,
            timestamp: new Date(item.created_at),
            isFavorite: item.favorite
          }))
        );

      } catch (err) {
        console.error(err);
      }
    }, []);

  const handleClear = useCallback(async () => {
      try {
        await API.delete("/api/history");

        setHistory([]);
        setFavorites(new Set());
        setFavoriteQuotes([]);

        toast("History cleared", "info");

      } catch (err) {
        console.error(err);
      }
    }, [toast]);

  const isFavorite = currentQuote
    ? !!history.find((e) => e.text === currentQuote.text && favorites.has(e.id))
    : false;


    const loadHistory = async () => {
      try {
        const response = await API.get("/api/history");

        const history = response.data.map((item: any) => ({
          id: item.id,
          text: item.quote,
          author: item.author,
          category: item.category,
          timestamp: new Date(item.created_at),
          isFavorite: item.favorite,
        }));

        setHistory(history);
      } catch (err) {
        console.error(err);
      }
    };
  // Generate initial quote on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        await loadHistory();

        const response = await API.get("/api/favorites");
        setFavorites(new Set(response.data.map((item: any) => item.id)));
        await handleGenerate();
      } catch (err) {
        console.error(err);
      }

      
    };

    initialize();
  }, []);
 // eslint-disable-line

  const pageVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
  };

  return (
    <div className="min-h-screen" style={{
      fontFamily: "'Inter', sans-serif",
      background: "#090b1a",
    }}>
      {/* mesh gradient bg */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent 70%)" }} />
        <div className="absolute top-1/3 -right-32 w-[400px] h-[400px] rounded-full blur-[100px] opacity-10"
          style={{ background: "radial-gradient(circle, #06b6d4, transparent 70%)" }} />
        <div className="absolute bottom-0 left-1/2 w-[500px] h-[300px] rounded-full blur-[100px] opacity-10"
          style={{ background: "radial-gradient(circle, #4f46e5, transparent 70%)" }} />
      </div>

      <Navbar current={page} onNav={setPage} />

      <main className="relative max-w-5xl mx-auto px-4 md:px-6 py-8">
        <AnimatePresence mode="wait">
          {page === "home" && (
            <motion.div key="home" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <HomePage
                currentQuote={currentQuote}
                isLoading={isLoading}
                history={history}
                favorites={favorites}
              
                onGenerate={handleGenerate}
                onShare={handleShare}
                onFavorite={handleFavorite}
                onOpenHistory={() => setPage("history")}
                onOpenFavorites={() => setPage("favorites")}
                
              />
            </motion.div>
          )}
          {page === "history" && (
            <motion.div key="history" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <HistoryPage
                history={history}
                favorites={favorites}
                onFavoriteToggle={handleFavoriteToggle}
                onRemove={handleRemove}
                onClear={handleClear}
              />
            </motion.div>
          )}
          {page === "favorites" && (
            <motion.div key="favorites" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <FavoritesPage
                history={history}
                favorites={favorites}
                onRemove={handleRemove}
              />
            </motion.div>
          )}
          {page === "about" && (
            <motion.div key="about" variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <AboutPage />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ToastContainer toasts={toasts} dismiss={dismissToast} />
    </div>
  );
}
