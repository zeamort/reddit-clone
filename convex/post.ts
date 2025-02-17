import { mutation, query, QueryCtx } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { getCurrentUser, getCurrentUserOrThrow } from "./users";
import {Doc, Id} from "./_generated/dataModel";

type EnrichedPost = Omit<Doc<"post">, "subreddit"> & {
    author: {username: string} | undefined
    subreddit: {
        _id: Id<"subreddit">;
        name: string;
    } | undefined
    imageUrl?: string
}

const ERROR_MESSAGES = {
    POST_NOT_FOUND: "Post not found",
    SUBREDDIT_NOT_FOUND: "Subreddit not found",
    UNAUTHORIZED_DELETE: "You can't delete this post"
} as const;

export const create = mutation({
    args: {
        subject: v.string(),
        body: v.string(),
        subreddit: v.id("subreddit"),
        storageId: v.optional(v.id("_storage"))
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUserOrThrow(ctx);
        const postId = await ctx.db.insert("post", {
            subject: args.subject,
            body: args.body,
            subreddit: args.subreddit,
            authorId: user._id,
            image: args.storageId || undefined
        });
        return postId;
    }
})

async function getEnrichedPost(
    ctx: QueryCtx, 
    post: Doc<"post">
): Promise<EnrichedPost> {
    const [author, subreddit] = await Promise.all([
        ctx.db.get(post.authorId),
        ctx.db.get(post.subreddit)
    ])
    const image = post.image && await ctx.storage.getUrl(post.image)

    return {
        ...post,
        author: author ? {username: author.username} : undefined,
        subreddit: {
            _id: subreddit!._id,
            name: subreddit!.name
        },
        imageUrl: image ?? undefined
    }
}

async function getEnrichedPosts(
    ctx: QueryCtx, 
    posts: Doc<"post">[]
): Promise<EnrichedPost[]> {
    return Promise.all(posts.map(post => getEnrichedPost(ctx, post)));
};

export const getPost = query({
    args: {id: v.id("post")},
    handler: async (ctx, args) => {
        const post = await ctx.db.get(args.id);

        if(!post) return null;

        return getEnrichedPost(ctx, post);
    }
});

export const getSubredditPosts = query({
    args: {subredditName: v.string()},
    handler: async (ctx, args): Promise<EnrichedPost[]> => {
        const subreddit = await ctx.db
            .query("subreddit")
            .filter((q) => q.eq(q.field("name"), args.subredditName))
            .unique();
        
        if (!subreddit) return [];

        const posts = await ctx.db
            .query("post")
            .withIndex("bySubreddit", (q) => q.eq("subreddit", subreddit._id))
            .collect();
        
        return getEnrichedPosts(ctx, posts);
    }
});

export const userPosts = query({
    args: {authorUsername: v.string()},
    handler: async (ctx, args): Promise<EnrichedPost[]> => {
        const user = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("username"), args.authorUsername))
            .unique();
        
        if (!user) return [];

        const posts = await ctx.db
            .query("post")
            .withIndex("byAuthor", (q) => q.eq("authorId", user._id))
            .collect();
        
        return getEnrichedPosts(ctx, posts);
    }
});

export const deletePost = mutation({
    args: {id: v.id("post")},
    handler: async (ctx, args) => {
        const post = await ctx.db.get(args.id);

        if (!post) throw new ConvexError({message: ERROR_MESSAGES.POST_NOT_FOUND});

        const user = await getCurrentUserOrThrow(ctx);
        
        if (post.authorId !== user._id) {
            throw new ConvexError({message: ERROR_MESSAGES.UNAUTHORIZED_DELETE});
        }

        await ctx.db.delete(args.id);
    }
});