import { redirect } from "next/navigation";

// Redirect from /admin/games/[gameId]/edit to /admin/tools/games/[gameId]/edit
export default function GameEditRedirect({ params }: { params: { gameId: string } }) {
  redirect(`/admin/tools/games/${params.gameId}/edit`);
}
