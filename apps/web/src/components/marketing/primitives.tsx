import type { ReactNode } from "react";
import Image from "next/image";
import { Star } from "lucide-react";

/** Frosted-glass card matching the shared RisingBrain theme. */
export function GlassCard({
  children,
  className = "",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={`glass ${hover ? "glass-hover" : ""} rounded-3xl ${className}`}>{children}</div>
  );
}

/** Centered max-width page container. */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`w-full px-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24 ${className}`}>{children}</div>
  );
}

/** A small frosted pill used for eyebrows/badges above a section title. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="glass-pill inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-accent">
      {children}
    </span>
  );
}

/** Five filled stars in the brand accent colour. */
export function Stars({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <div className="flex gap-0.5 text-accent" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`${className} fill-current`} />
      ))}
    </div>
  );
}

const avatarPalettes = [
  "from-rb-green-500 to-rb-green-700",
  "from-teal-400 to-emerald-700",
  "from-emerald-400 to-green-700",
  "from-green-500 to-teal-800",
  "from-lime-500 to-emerald-700",
  "from-emerald-500 to-teal-600",
];

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function avatarPalette(name: string) {
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return avatarPalettes[sum % avatarPalettes.length];
}

// Real student photos (in /public/students). Names map to file slugs.
const PHOTO_NAMES = new Set([
  "priya-sharma",
  "rahul-verma",
  "sneha-iyer",
  "aditya-kulkarni",
  "megha-nair",
  "karan-mehta",
]);

function slugifyName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** Returns the public photo path for a known person, else undefined. */
export function photoFor(name: string): string | undefined {
  const slug = slugifyName(name);
  return PHOTO_NAMES.has(slug) ? `/students/${slug}.jpg` : undefined;
}

/**
 * Avatar — uses a real photo when one exists for the person (or an explicit
 * `src`), otherwise falls back to a branded initials chip.
 */
export function Avatar({
  name,
  src,
  className = "h-12 w-12 text-sm",
}: {
  name: string;
  src?: string;
  className?: string;
}) {
  const photo = src ?? photoFor(name);
  if (photo) {
    return (
      <div
        className={`${className} relative shrink-0 overflow-hidden rounded-full ring-2 ring-rb-green-500/30`}
        role="img"
        aria-label={name}
      >
        <Image src={photo} alt={name} fill sizes="96px" className="object-cover" />
      </div>
    );
  }
  return (
    <div
      className={`${className} grid shrink-0 place-items-center rounded-full bg-gradient-to-br ${avatarPalette(
        name
      )} font-bold text-black ring-2 ring-rb-green-500/30`}
      role="img"
      aria-label={name}
    >
      {initials(name)}
    </div>
  );
}
