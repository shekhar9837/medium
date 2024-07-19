import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { sign } from 'hono/jwt';
import { signupInput } from '@shekhar9837/medium-common';
export const userRouter = new Hono();
userRouter.post('/signup', async (c) => {
    const body = await c.req.json();
    const { success, error } = signupInput.safeParse(body);
    if (!success) {
        c.status(400); // 400 Bad Request is more appropriate for validation errors
        return c.json({
            message: "Inputs not correct",
            error: error.errors // Provide the validation errors for better debugging
        });
    }
    const prisma = new PrismaClient({
        datasources: { db: { url: c.env.DATABASE_URL } }
    }).$extends(withAccelerate());
    try {
        const user = await prisma.user.create({
            data: {
                email: body.username,
                password: body.password,
                name: body.name
            }
        });
        const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
        return c.text(jwt);
    }
    catch (e) {
        console.log(e);
        c.status(500); // 500 Internal Server Error for server-side issues
        return c.json({ msg: 'Invalid' });
    }
});
userRouter.post('/signin', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,
    }).$extends(withAccelerate());
    const body = await c.req.json();
    const user = await prisma.user.findUnique({
        where: {
            email: body.username
        }
    });
    if (!user) {
        c.status(403);
        return c.json({ error: "user not found" });
    }
    const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
    return c.json({ jwt });
});
