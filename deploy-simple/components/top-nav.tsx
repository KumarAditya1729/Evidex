import Link from "next/link";
import { WalletAuthButton } from "@/components/wallet-auth-button";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/upload", label: "Upload" },
  { href: "/verify", label: "Verify" },
  { href: "/explorer", label: "Explorer" },
  { href: "/admin", label: "Admin" },
  { href: "/admin/chains", label: "Chains" },
  { href: "/settings", label: "Settings" }
];

export function TopNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-cloud/10 bg-canvas/80 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold tracking-wide text-cloud">
          Evidex Evidence Platform
        </Link>
        <div className="hidden items-center gap-4 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1 text-sm text-cloud/80 transition hover:bg-cloud/10 hover:text-cloud"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <WalletAuthButton />
      </nav>
    </header>
  );
}
