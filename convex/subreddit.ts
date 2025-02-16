import { mutation } from "./_generated/server";
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