import request from 'supertest';
import app from '@/main';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);

const prisma = new PrismaClient();

describe("Payment-status API", () => {
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

    it("should get 404 when getting a payment status by id that don't exits", async () => {

        const response = await request(app)
            .get("/paymentstatus/1")
            .expect(404);

        expect(response.body).toEqual({
            error: "Payment status not found"
        });
    });

    it("should get 404 when getting all payment status with no payment status created", async () => {

        const response = await request(app)
            .get("/paymentstatus")
            .expect(404);

        expect(response.body).toEqual({
            error: "No payment statuses found"
        });
    })

    it("should return 400 when creating a payment status with an empty name", async () => {
        const paymentStatus = {
            name: ""
        }

        const response = await request(app)
            .post("/paymentstatus/create")
            .send(paymentStatus)
            .expect(400);

        expect(response.body).toEqual({
            error: "Invalid payload provided."
        });
    })

    it("should return 400 when creating a payment status with invalid payload", async () => {
        const paymentStatus = {
            name: "",
            description: "Description field don't exist in the model"
        }

        const response = await request(app)
            .post("/paymentstatus/create")
            .send(paymentStatus)
            .expect(400);

        expect(response.body).toEqual({ "error": "Invalid payload provided." })
    })

    it("should return 400 when updating a payment status with invalid payload", async () => {
        const paymentStatus = {
            name: "",
            description: "Description field don't exist in the model"
        }

        const response = await request(app)
            .put("/paymentstatus/1")
            .send(paymentStatus)
            .expect(400);

        expect(response.body).toEqual({ "error": "Invalid payload provided." })
    })

    it("should create a payment status", async () => {
        const paymentStatus = {
            name: "Test payment Status 1"
        }

        const response = await request(app)
            .post("/paymentstatus/create")
            .send(paymentStatus)
            .expect(201);

        expect(response.body.id).toEqual(1);
        expect(response.body.name).toEqual("Test payment Status 1");
    });

    it("should update a payment status", async () => {
        const paymentStatus = {
            name: "Test payment Status 1"
        }

        await request(app)
            .post("/paymentstatus/create")
            .send(paymentStatus)
            .expect(201);

        const updatedPaymentStatus = {
            name: "Test payment Status 2"
        }

        const response = await request(app)
            .put("/paymentstatus/1")
            .send(updatedPaymentStatus)
            .expect(200);

        expect(response.body.id).toEqual(1);
        expect(response.body.name).toEqual("Test payment Status 2");
    });

    it("should receive 404 when updating a payment status that does not exist", async () => {
        const paymentStatus = {
            name: "Test payment Status 1"
        }

        const response = await request(app)
            .put("/paymentstatus/100")
            .send(paymentStatus)
            .expect(404);

        expect(response.body).toEqual({
            error: "Payment status not found"
        });
    })

    it("should receive 404 when deleting a payment status that does not exist", async () => {
        const response = await request(app)
            .delete("/paymentstatus/100")
            .expect(404);

        expect(response.body).toEqual({
            error: "Payment status not found"
        });
    })

    it("should delete a payment status", async () => {
        const paymentStatus = {
            name: "Test payment Status 1"
        }

        await request(app)
            .post("/paymentstatus/create")
            .send(paymentStatus)
            .expect(201);

        const response = await request(app)
            .delete("/paymentstatus/1")
            .expect(200);

        expect(response.body.id).toEqual(1);
        expect(response.body.name).toEqual("Test payment Status 1");
        expect(response.body.deletedAt).not.toBeNull();
    })
})