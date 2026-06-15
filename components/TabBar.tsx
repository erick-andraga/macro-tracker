"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";

function Icon({ name }: { name: string }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "today":
      return (
        <svg {...common}>
          <path d="M3 12h4l2 5 4-12 2 7h6" />
        </svg>
      );
    case "foods":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "history":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 3v4M16 3v4" />
        </svg>
      );
    case "profile":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
        </svg>
      );
    default:
      return null;
  }
}

const tabs = [
  { href: "/", label: "Today", icon: "today" },
  { href: "/foods", label: "Foods", icon: "foods" },
  { href: "/calendar", label: "History", icon: "history" },
  { href: "/profile", label: "Profile", icon: "profile" },
];

export default function TabBar() {
  const pathname = usePathname();
  const { foods } = useStore();
  return (
    <nav className="tabbar">
      <div className="tabbar-inner">
        {tabs.map((t) => {
          const active =
            t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          const title =
            t.href === "/foods" ? `${foods.length} foods registered` : t.label;
          return (
            <Link
              key={t.href}
              href={t.href}
              title={title}
              className={`tab${active ? " active" : ""}`}
            >
              <span className="icon">
                <Icon name={t.icon} />
              </span>
              <span>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
