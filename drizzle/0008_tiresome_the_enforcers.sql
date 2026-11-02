CREATE TABLE "mentions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"author_id" text NOT NULL,
	"post_uuid" uuid NOT NULL,
	"comment_uuid" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"actor_id" text NOT NULL,
	"kind" text NOT NULL,
	"post_uuid" uuid,
	"comment_uuid" uuid,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_tags" (
	"post_uuid" uuid NOT NULL,
	"tag" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "post_tags_post_uuid_tag_pk" PRIMARY KEY("post_uuid","tag")
);
--> statement-breakpoint
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_post_uuid_posts_uuid_fk" FOREIGN KEY ("post_uuid") REFERENCES "public"."posts"("uuid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_comment_uuid_comments_uuid_fk" FOREIGN KEY ("comment_uuid") REFERENCES "public"."comments"("uuid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_post_uuid_posts_uuid_fk" FOREIGN KEY ("post_uuid") REFERENCES "public"."posts"("uuid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_comment_uuid_comments_uuid_fk" FOREIGN KEY ("comment_uuid") REFERENCES "public"."comments"("uuid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_post_uuid_posts_uuid_fk" FOREIGN KEY ("post_uuid") REFERENCES "public"."posts"("uuid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mentions_user_idx" ON "mentions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mentions_post_idx" ON "mentions" USING btree ("post_uuid");--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "post_tags_tag_created_idx" ON "post_tags" USING btree ("tag","created_at");