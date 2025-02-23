import {defineSchema, defineTable} from "convex/server";
import {v} from "convex/values";

export default defineSchema({
    users: defineTable({
        username: v.string(),
        externalId: v.string()
    })
        .index("byExternalId", ["externalId"])
        .index("byUsername", ["username"]),
    subreddit: defineTable({
        name: v.string(),
        description: v.optional(v.string()),
        authorId: v.id("users")
    }),
    post: defineTable({
        subject: v.string(),
        body: v.string(),
        subreddit: v.id("subreddit"),
        authorId: v.id("users"),
        image: v.optional(v.id("_storage"))
    })
        .index("bySubreddit", ["subreddit"])
        .index("byAuthor", ["authorId"]),
    comments: defineTable({
        content: v.string(),
        postId: v.id("post"),
        authorId: v.id("users")
    })
        .index("byPost", ["postId"]),
    downvote: defineTable({
        postId: v.id("post"),
        userId: v.id("users")
    })
        .index("byPost", ["postId"])
        .index("byUser", ["userId"]),
    upvote: defineTable({
        postId: v.id("post"),
        userId: v.id("users")
    })
        .index("byPost", ["postId"])
        .index("byUser", ["userId"])
});