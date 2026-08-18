import { CodexNavigation } from "@/components/codex-navigation";

export default function CodexLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <><CodexNavigation />{children}</>;
}
