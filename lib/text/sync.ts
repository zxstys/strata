// lib/text/sync.ts
import { db } from "@/lib/db/db";
import { push, userChannel } from "@/lib/dm/pusher-server";
import { parseEntities } from "@/lib/text/entities";
import { mentions, notifications, postTags, user } from "@/schema";
import { and, eq, inArray, isNull } from "drizzle-orm";

async function resolveUserIds(usernames: string[]) {
  if (usernames.length === 0) return [];
  const rows = await db
    .select({ id: user.id })
    .from(user)
    .where(inArray(user.username, usernames));
  return rows.map((r) => r.id);
}

async function notifyMentioned(
  recipientIds: string[],
  actorId: string,
  postUuid: string,
  commentUuid: string | null
) {
  if (recipientIds.length === 0) return;

  const rows = await db
    .insert(notifications)
    .values(
      recipientIds.map((userId) => ({
        userId,
        actorId,
        kind: "mention",
        postUuid,
        commentUuid,
      }))
    )
    .returning({ id: notifications.id, userId: notifications.userId });

  // Realtime is best-effort. The notification is already saved.
  await Promise.all(
    rows.map((r) =>
      push(userChannel(r.userId), "notification", { id: r.id, kind: "mention" })
    )
  );
}

export async function syncPostEntities(postUuid: string, authorId: string, content: string) {
  const parsed = parseEntities(content);

  // Hashtags: replace the post's tags with the current set.
  await db.delete(postTags).where(eq(postTags.postUuid, postUuid));
  if (parsed.tags.length > 0) {
    await db
      .insert(postTags)
      .values(parsed.tags.map((tag) => ({ postUuid, tag })))
      .onConflictDoNothing();
  }

  // Mentions: diff against the previous set so an edit never re-notifies anyone.
  const wanted = new Set(
    (await resolveUserIds(parsed.usernames)).filter((id) => id !== authorId)
  );

  const existing = await db
    .select({ userId: mentions.userId })
    .from(mentions)
    .where(and(eq(mentions.postUuid, postUuid), isNull(mentions.commentUuid)));
  const current = new Set(existing.map((r) => r.userId));

  const removed = [...current].filter((id) => !wanted.has(id));
  const added = [...wanted].filter((id) => !current.has(id));

  if (removed.length > 0) {
    await db
      .delete(mentions)
      .where(
        and(
          eq(mentions.postUuid, postUuid),
          isNull(mentions.commentUuid),
          inArray(mentions.userId, removed)
        )
      );
  }

  if (added.length > 0) {
    await db
      .insert(mentions)
      .values(added.map((userId) => ({ userId, authorId, postUuid })));
    await notifyMentioned(added, authorId, postUuid, null);
  }
}

export async function syncCommentEntities(
  commentUuid: string,
  postUuid: string,
  authorId: string,
  content: string
) {
  const { usernames } = parseEntities(content);
  const ids = [
    ...new Set((await resolveUserIds(usernames)).filter((id) => id !== authorId)),
  ];
  if (ids.length === 0) return;

  await db
    .insert(mentions)
    .values(ids.map((userId) => ({ userId, authorId, postUuid, commentUuid })));
  await notifyMentioned(ids, authorId, postUuid, commentUuid);
}