// app/api/profile/route.ts
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/db";
import { isBlobUrl } from "@/lib/post/media";
import { user } from "@/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function getMe() {
    const session = await auth.api.getSession({ headers: await headers() });
    return session?.user ?? null;
}

export async function GET() {
    const me = await getMe();
    if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const [row] = await db
        .select({
            name: user.name,
            username: user.username,
            about: user.about,
            image: user.image,
            banner: user.banner,
            verified: user.verified,
            goldPermission: user.goldPermission,
            goldEnabled: user.goldEnabled,
        })
        .from(user)
        .where(eq(user.id, me.id))
        .limit(1);

    return NextResponse.json(row, { status: 200 });
}

export async function PATCH(request: NextRequest) {
    const me = await getMe();
    if (!me) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const update: Partial<typeof user.$inferInsert> = {};

    if (body.name !== undefined) {
        const name = typeof body.name === "string" ? body.name.trim() : "";
        if (name.length < 1 || name.length > 50) {
            return NextResponse.json({ message: "Name must be 1 to 50 characters." }, { status: 400 });
        }
        update.name = name;
    }

    if (body.about !== undefined) {
        const about = typeof body.about === "string" ? body.about.trim() : "";
        if (about.length > 160) {
            return NextResponse.json({ message: "About must be 160 characters or fewer." }, { status: 400 });
        }
        update.about = about;
    }

    const image = body.image !== undefined ? body.image : body.avatar;

    if (image !== undefined) {
        if (image !== null && !isBlobUrl(image)) {
            return NextResponse.json({ message: "Invalid image." }, { status: 400 });
        }
        update.image = image;
    }

    if (body.banner !== undefined) {
        if (body.banner !== null && !isBlobUrl(body.banner)) {
            return NextResponse.json({ message: "Invalid banner." }, { status: 400 });
        }
        update.banner = body.banner;
    }

    if (body.goldEnabled !== undefined) {
        if (typeof body.goldEnabled !== "boolean") {
            return NextResponse.json({ message: "Invalid value." }, { status: 400 });
        }
        // The server checks permission. The client can't turn gold on by itself.
        const [row] = await db
            .select({ goldPermission: user.goldPermission })
            .from(user)
            .where(eq(user.id, me.id))
            .limit(1);

        if (body.goldEnabled && !row?.goldPermission) {
            return NextResponse.json(
                { message: "You don't have permission for a gold checkmark." },
                { status: 403 }
            );
        }
        update.goldEnabled = body.goldEnabled;
    }

    if (Object.keys(update).length === 0) {
        return NextResponse.json({ message: "Nothing to update." }, { status: 400 });
    }

    await db.update(user).set(update).where(eq(user.id, me.id));
    return NextResponse.json({ message: "ok" }, { status: 200 });
}