import request from 'supertest';
import app from '@/main';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);

const prisma = new PrismaClient();

describe("Permission API", () => {
    beforeEach(async () => {
        process.env.APPLICATION_DEV_MODE = "false"
        // Reset the database state before each test
        try {
            await execPromise('npx prisma migrate reset --force');
            // Add any other necessary cleanup or seeding here
        } catch (error) {
            console.error('Failed to reset database:', error);
        }
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it("should receive 404 when trying to get a permission by id that don't exists", async () => {
        const response = await request(app)
            .get("/permissions/1")
            .expect(404);

        expect(response.body).toEqual({
            error: "Permission not found"
        });
    })

    it("should receive 404 when trying to get all permissions and there is none", async () => {
        const response = await request(app)
            .get("/permissions")
            .expect(404);

        expect(response.body).toEqual({
            error: "Permissions not found"
        });
    })

    it("should receive 404 when trying to update a permission that don't exists", async () => {
        const response = await request(app)
            .put("/permissions/1")
            .send({ name: "Test permission" })
            .expect(404);

        expect(response.body).toEqual({
            error: "Permission not found"
        });
    })

    it("should receive 404 when trying to delete a permission that don't exists", async () => {
        const response = await request(app)
            .delete("/permissions/1")
            .expect(404);

        expect(response.body).toEqual({
            error: "Permission not found"
        });
    })

    it("should receive 400 when trying to create a permission with invalid payload", async () => {
        const permission = {
            name: ""
        }

        const permissionWrongField = {
            name: "",
            description: "Test description"
        }

        const response = await request(app)
            .post("/permissions/create")
            .send(permission)
            .expect(400);

        const responseWrongField = await request(app)
            .put("/permissions/create")
            .send(permissionWrongField)
            .expect(400);

        expect(response.body).toEqual({ "error": "Invalid payload provided." });
        expect(responseWrongField.body).toEqual({ "error": "Invalid payload provided." });
    })

    it("should receive 400 when trying to update a permission with invalid payload", async () => {
        const permission = {
            name: ""
        }

        const permissionWrongField = {
            name: "",
            description: "Test description"
        }

        const response = await request(app)
            .put("/permissions/1")
            .send(permission)
            .expect(400);

        const responseWrongField = await request(app)
            .put("/permissions/1")
            .send(permissionWrongField)
            .expect(400);

        expect(response.body).toEqual({ "error": "Invalid payload provided." });
        expect(responseWrongField.body).toEqual({ "error": "Invalid payload provided." });
    })

    it("should create a permission", async () => {
        const permission = {
            name: "Test permission"
        }

        const response = await request(app)
            .post("/permissions/create")
            .send(permission)
            .expect(201);

        expect(response.body.name).toEqual("Test permission");
        expect(response.body.id).toEqual(1);
    })

    it("should get all permissions", async () => {
        const permission = {
            name: "Test permission"
        }

        await request(app)
            .post("/permissions/create")
            .send(permission)
            .expect(201);

        const response = await request(app)
            .get("/permissions")
            .expect(200);

        expect(response.body.length).toEqual(1);
        expect(response.body[0].name).toEqual("Test permission");
    })

    it("should get a permission by id", async () => {
        const permission = {
            name: "Test permission"
        }

        await request(app)
            .post("/permissions/create")
            .send(permission)
            .expect(201);

        const response = await request(app)
            .get("/permissions/1")
            .expect(200);

        expect(response.body.id).toEqual(1);
        expect(response.body.name).toEqual("Test permission");
    })

    it("should update a permission", async () => {
        const permission = {
            name: "Test permission"
        }

        await request(app)
            .post("/permissions/create")
            .send(permission)
            .expect(201);

        const response = await request(app)
            .put("/permissions/1")
            .send({ name: "Updated permission" })
            .expect(200);

        expect(response.body.id).toEqual(1);
        expect(response.body.name).toEqual("Updated permission");
    })

    it("should delete a permission", async () => {
        const permission = {
            name: "Test permission"
        }

        await request(app)
            .post("/permissions/create")
            .send(permission)
            .expect(201);

        const response = await request(app)
            .delete("/permissions/1")
            .expect(200);

        expect(response.body.id).toEqual(1);
        expect(response.body.deletedAt).not.toBeNull();
    })
})