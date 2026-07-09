import Link from "next/link";
import { Brain } from "lucide-react";
import { InstagramIcon, LinkedInIcon, YouTubeIcon } from "./brand-icons";

const columns: { title: string; links: [string, string][] }[] = [
  {
    title: "Product",
    links: [
      ["Sheets", "/sheet"],
      ["Domain", "/domain"],
      ["Screening", "/screening"],
      ["Interview Stories", "/interview"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About", "/#founder"],
      ["Courses", "/courses"],
      ["Interview Stories", "/interview"],
    ],
  },
];

const socials = [
  { Icon: LinkedInIcon, href: "https://www.linkedin.com/company/risingbrain/", label: "LinkedIn" },
  { Icon: YouTubeIcon, href: "https://www.youtube.com/@rbanjalikumari", label: "YouTube" },
  { Icon: InstagramIcon, href: "https://www.instagram.com/rbanjali.codes/", label: "Instagram" },
];

export function Footer() {
  return (
    <footer className="px-4 pb-6 pt-8 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
      <div className="glass w-full rounded-3xl px-6 py-10 sm:px-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-rb-green-500">
                <Brain className="h-5 w-5 text-black" strokeWidth={2.5} />
              </span>
              <span className="text-lg font-semibold">
                Rising<span className="text-rb-green-400">Brain</span>
              </span>
            </div>
            <p className="max-w-xs text-sm text-muted">
              The founder-led, pattern-first placement platform — curated sheets, a real coding
              arena, live contests and mentorship, all in one place.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 text-sm font-semibold text-foreground">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-muted transition-colors hover:text-accent"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted">© 2026 RisingBrain. Built for learners.</p>
          <div className="flex items-center gap-3">
            {socials.map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="glass-pill grid h-9 w-9 place-items-center rounded-xl text-muted transition-colors hover:text-accent"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
