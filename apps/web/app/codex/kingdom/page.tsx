import { permanentRedirect } from "next/navigation";

/** Preserve existing bookmarks while Nation Management owns the canonical URL. */
export default function LegacyNationManagementRoute() {
  permanentRedirect("/codex/nation");
}
