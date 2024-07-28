import request from 'supertest';
import app from '@/main';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);

const prisma = new PrismaClient();

describe("Payment Method API", () => {
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

    it("should get a payment method by id", async () => {

        const response = await request(app)
            .get("/paymentmethod/1")
            .expect(404);

        expect(response.body).toEqual({
            error: "Payment method not found"
        });
    });

    it("should get all payment methods", async () => {

        const response = await request(app)
            .get("/paymentmethod")
            .expect(404);

        expect(response.body).toEqual({
            error: "No found any payment methods"
        });
    })

    it("should create a payment method", async () => {
        const paymentMethod = {
            name: "Test payment Method 1"
        }

        const response = await request(app)
            .post("/paymentmethod/create")
            .send(paymentMethod)
            .expect(201);

        expect(response.body.id).toEqual(1);
        expect(response.body.name).toEqual("Test payment Method 1");
    });

    it("should return 400 when creating a payment method with invalid payload", async () => {
        const paymentMethod = {
            name: "",
            description: "Description field don't exist in the model"
        }

        const response = await request(app)
            .post("/paymentmethod/create")
            .send(paymentMethod)
            .expect(400);

        expect(response.body).toEqual({ "error": "Invalid payload provided." })
    });

    it("should return 400 when creating a payment method with invalid payload", async () => {
        const paymentMethod = {
            name: ""
        }

        const response = await request(app)
            .post("/paymentmethod/create")
            .send(paymentMethod)
            .expect(400);

        expect(response.body).toEqual({ "error": "Invalid payload provided." })
    });

    it("should return 404 when getting a payment method by id that does not exist", async () => {
        const response = await request(app)
            .get("/paymentmethod/2")
            .expect(404);

        expect(response.body).toEqual({ "error": "Payment method not found" });
    });

    it("should return 400 when updating a payment method with invalid payload", async () => {
        const paymentMethod = {
            name: ""
        }

        const response = await request(app)
            .put("/paymentmethod/1")
            .send(paymentMethod)
            .expect(400);

        expect(response.body).toEqual({ "error": "Invalid payload provided." });
    });

    it("should return 404 when updating a payment method that does not exist", async () => {
        const paymentMethod = {
            name: "Updated payment method"
        }

        const response = await request(app)
            .put("/paymentmethod/100")
            .send(paymentMethod)
            .expect(404);

        expect(response.body).toEqual({ "error": "Payment method not found" });
    })

    it("should return 404 when deleting a payment method that does not exist", async () => {
        const response = await request(app)
            .delete("/paymentmethod/100")
            .expect(404);

        expect(response.body).toEqual({ "error": "Payment method not found" });
    })

    it("should delete a payment method", async () => {
        const paymentMethod = {
            name: "Test payment Method 1"
        }

        await request(app)
            .post("/paymentmethod/create")
            .send(paymentMethod)
            .expect(201);

        const response = await request(app)
            .delete("/paymentmethod/1")
            .expect(200);

        expect(response.body.deletedAt).not.toBeNull();
    })
})