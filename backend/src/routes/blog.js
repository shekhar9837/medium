import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { verify } from 'hono/jwt';
export const blogRouter = new Hono();
blogRouter.use("/*", async (c, next) => {
    const authHeader = c.req.header('Authorization') || '';
    const user = await verify(authHeader, c.env.JWT_SECRET);
    if (user) {
        //@ts-ignore
        c.set("userId", user.id);
        await next();
    }
    else {
        c.status(403);
        return c.json({
            error: "unauthorized"
        });
    }
});
blogRouter.post('/', async (c) => {
    const body = await c.req.json();
    const authorId = c.get("userId");
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());
    const blog = await prisma.post.create({
        data: {
            title: body.title,
            content: body.content,
            authorId: authorId
        }
    });
    return c.json({
        id: blog.id
    });
});
blogRouter.get('/', async (c) => {
    const body = await c.req.json();
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());
    try {
        const blog = await prisma.post.findFirst({
            where: {
                id: body.id
            },
        });
        return c.json({
            blog
        });
    }
    catch (err) {
        c.status(404);
        return c.json({
            error: "error while fetching post"
        });
    }
});
blogRouter.put('/', async (c) => {
    const body = await c.req.json();
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());
    const blog = await prisma.post.update({
        where: {
            id: body.id
        },
        data: {
            title: body.title,
            content: body.content
        }
    });
    return c.json({
        id: blog.id
    });
});
blogRouter.get('/bulk', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());
    const blog = await prisma.post.findMany();
    return c.json({
        blog
    });
});
blogRouter.get('/:id', async (c) => {
    const id = c.req.param("id");
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    try {
        const blog = await prisma.post.findFirst({
            where: {
                id: id
            },
            select: {
                id: true,
                title: true,
                content: true,
                author: {
                    select: {
                        name: true
                    }
                }
            }
        });
        return c.json({
            blog
        });
    }
    catch (e) {
        c.status(411); // 4
        return c.json({
            message: "Error while fetching blog post"
        });
    }
});
