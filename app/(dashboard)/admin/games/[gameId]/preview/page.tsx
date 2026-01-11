import { redirect } from "next/navigation";

// Redirect from /admin/games/[gameId]/preview to /admin/tools/games/[gameId]/preview
export default function GamePreviewRedirect({ params }: { params: { gameId: string } }) {
  redirect(`/admin/tools/games/${params.gameId}/preview`);
}
