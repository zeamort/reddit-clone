import { mutation, query } from "./_generated/server";
import { getEnrichedPosts } from "./post";
import { getCurrentUserOrThrow } from "./users";
import { v, ConvexError } from "convex/values";

export const create = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUserOrThrow(ctx);
        const subreddits = await ctx.db.query("subreddit").collect();

        if (subreddits.some((s) => s.name === args.name)) {
            throw new ConvexError({message: "subreddit already exists"});
        }
        await ctx.db.insert("subreddit", {
            name: args.name,
            description: args.description,
            authorId: user._id
        })
    }
})

export const get = query({
    args: {name: v.string()},
    handler: async (ctx, args) => {
        const subreddit = await ctx.db
            .query("subreddit")
            .filter((q) => q.eq(q.field("name"), args.name))
            .unique();
        
        if (!subreddit) return null;

        const posts = await ctx.db
            .query("post")
            .withIndex("bySubreddit", (q) => q.eq("subreddit", subreddit._id))
            .collect();

        const enrichedPosts = await getEnrichedPosts(ctx, posts);

        return {...subreddit, posts: enrichedPosts};
    },
});