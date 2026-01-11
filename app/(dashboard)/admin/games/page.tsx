import { redirect } from "next/navigation";

// Permanent redirect from /admin/games to /admin/tools/games
export default function GamesRedirect() {
  redirect("/admin/tools/games");
}
