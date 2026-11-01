import { forbidden, getAdminSession } from "@/lib/admin/admin";
import { db } from "@/lib/db/db";
import { posts, user } from "@/schema";
import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const PAGE_SIZE = 20;
const ROLES = ["user", "mod", "admin"] as const;
type Role = (typeof ROLES)[number];

const isRole = (v: unknown): v is Role =>
  typeof v === "string" && (ROLES as readonly string[]).includes(v);

const escapeLike = (s: string) => s.replace(/[%_\\]/g, "\\$&");

export async function GET(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return forbidden();

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const page = Math.max(Number(request.nextUrl.searchParams.get("page")) || 1, 1);
  const pattern = `%${escapeLike(q)}%`;

  const where = q
    ? or(
        ilike(user.name, pattern),
        ilike(user.username, pattern),
        ilike(user.email, pattern)
      )
    : undefined;

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      image: user.image,
      role: user.role,
      verified: user.verified,
      goldPermission: user.goldPermission,
      goldEnabled: user.goldEnabled,
      createdAt: user.createdAt,
      postCount: sql<number>`(select count(*)::int from ${posts} where ${posts.userId} = ${user.id})`,
    })
    .from(user)
    .where(where)
    .orderBy(desc(user.createdAt))
    .limit(PAGE_SIZE + 1)
    .offset((page - 1) * PAGE_SIZE);

  const users = rows.slice(0, PAGE_SIZE).map((r) => ({
    ...r,
    postCount: Number(r.postCount) || 0,
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json(
    { users, hasMore: rows.length > PAGE_SIZE, page },
    { status: 200 }
  );
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) return forbidden();

  const body = await request.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId : "";
  if (!userId) {
    return NextResponse.json({ message: "userId is required." }, { status: 400 });
  }

  const update: Partial<typeof user.$inferInsert> = {};

  if (body.role !== undefined) {
    if (!isRole(body.role)) {
      return NextResponse.json(
        { message: "Role must be user, mod, or admin." },
        { status: 400 }
      );
    }
    if (userId === admin.id && body.role !== "admin") {
      return NextResponse.json(
        { message: "You can't remove your own admin role." },
        { status: 400 }
      );
    }
    update.role = body.role;
  }

  if (typeof body.verified === "boolean") {
    update.verified = body.verified;
  }

  if (typeof body.goldPermission === "boolean") {
    update.goldPermission = body.goldPermission;
    // Removing permission also turns the badge off.
    if (!body.goldPermission) update.goldEnabled = false;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ message: "Nothing to update." }, { status: 400 });
  }

  const [row] = await db
    .update(user)
    .set(update)
    .where(eq(user.id, userId))
    .returning({ id: user.id });

  if (!row) {
    return NextResponse.json({ message: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ message: "ok" }, { status: 200 });
}