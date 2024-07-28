import request from 'supertest';
import app from '@/main';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);

const prisma = new PrismaClient()

describe("Status API", () => {
    beforeEach(async () => {
        process.env.APPLICATION_DEV_MODE = "false"
        // Reset the database state before each test
        try {
            await execPromise('npx prisma migrate reset --force');
            // Add any other necessary cleanup or seeding here
        } catch (error) {
            console.error('Failed to reset database:', error);
        }
    })

    afterAll(async () => {
        await prisma.$disconnect();
    })

    it("should get 404 when getting a status by id that don't exits", async () => {
        const response = await request(app)
            .get("/status/1")
            .expect(404);

        expect(response.body).toEqual({
            error: "Status not found"
        });
    })

    it("should get 404 when getting all status with no status created", async () => {
        const response = await request(app)
            .get("/status")
            .expect(404);

        expect(response.body).toEqual({
            error: "No statuses found"
        });
    })

    it("should return 404 when updating a status that don't exits", async () => {
        const response = await request(app)
            .put("/status/1")
            .send({
                name: "Test"
            })
            .expect(404);

        expect(response.body).toEqual({
            error: "Status not found"
        });
    })

    it("should return 404 when deleting a status that don't exits", async () => {
        const response = await request(app)
            .delete("/status/1")
            .expect(404);

        expect(response.body).toEqual({
            error: "Status not found"
        });
    })

    it("should return 400 when creating a status with an empty name", async () => {
        const status = {
            name: ""
        }

        const response = await request(app)
            .post("/status/create")
            .send(status)
            .expect(400);

        expect(response.body).toEqual({
            error: "Invalid payload provided."
        });
    })

    it("should return 400 when creating a status with invalid payload", async () => {
        const status = {
            name: "",
            description: "Description field don't exist in the model"
        }

        const response = await request(app)
            .post("/status/create")
            .send(status)
            .expect(400);

        expect(response.body).toEqual({ "error": "Invalid payload provided." })
    })

    it("should return 400 when updating a status with invalid payload", async () => {
        const status = {
            name: "",
            description: "Description field don't exist in the model"
        }

        const response = await request(app)
            .put("/status/1")
            .send(status)
            .expect(400);

        expect(response.body).toEqual({ "error": "Invalid payload provided." })
    })

    it("should create a status", async () => {
        const status = {
            name: "Test Status 1"
        }

        const response = await request(app)
            .post("/status/create")
            .send(status)
            .expect(201);

        expect(response.body.id).toEqual(1)
        expect(response.body.name).toEqual("Test Status 1")
    })

    it("should update a status", async () => {
        const status = {
            name: "Test Status 1"
        }

        await request(app)
            .post("/status/create")
            .send(status)
            .expect(201);

        const response = await request(app)
            .put("/status/1")
            .send({
                name: "Test Status 2"
            })
            .expect(200);

        expect(response.body.id).toEqual(1)
        expect(response.body.name).toEqual("Test Status 2")
    })

    it("should delete a status", async () => {
        const status = {
            name: "Test Status 1"
        }

        await request(app)
            .post("/status/create")
            .send(status)
            .expect(201);

        const response = await request(app)
            .delete("/status/1")
            .expect(200);

        expect(response.body.deletedAt).not.toBeNull();
    })

})