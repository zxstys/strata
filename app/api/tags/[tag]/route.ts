// app/api/tags/[tag]/route.ts
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/db";
import { postQueryFields, toPost } from "@/lib/post/post-query";
import { postTags, posts, user } from "@/schema";
import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const TAG_RE = /^[a-z][a-z0-9_]{1,49}$/;
const PAGE = 20;

type RouteParams = { params: Promise<{ tag: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { tag: raw } = await params;
  const tag = raw.toLowerCase();

  if (!TAG_RE.test(tag)) {
    return NextResponse.json({ message: "Invalid tag." }, { status: 400 });
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const viewerId = session?.user?.id ?? null;
  const page = Math.max(Number(request.nextUrl.searchParams.get("page")) || 1, 1);

  const rows = await db
    .select(postQueryFields(viewerId))
    .from(postTags)
    .innerJoin(posts, eq(posts.uuid, postTags.postUuid))
    .innerJoin(user, eq(user.id, posts.userId))
    .where(eq(postTags.tag, tag))
    .orderBy(desc(posts.createdAt))
    .limit(PAGE)
    .offset((page - 1) * PAGE);

  return NextResponse.json(rows.map(toPost), { status: 200 });
}