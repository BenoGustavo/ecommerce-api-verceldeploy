import request from 'supertest';
import app from '@/main';
import { PrismaClient, User } from '@prisma/client';
import { exec } from 'child_process';
import bcrypt from "bcrypt";
import util from 'util';
const execPromise = util.promisify(exec);

const prisma = new PrismaClient()

async function createAdminUser(): Promise<User> {
    try {
        return prisma.permission.create({
            data: {
                name: "Admin"
            }
        }).then(async permission => {
            const userPassword = await bcrypt.hash("unit_testing", 10)
            return prisma.user.create({
                data: {
                    "email": "test.user@gmail.com",
                    "password": userPassword,
                    "id_permission": permission.id,
                    "first_name": "Test",
                    "last_name": "User",
                }
            })
        }).then((user) => {
            return user;
        })
    } catch (error) {
        console.error('Failed to create admin user:', error);
        throw error;
    }
}

async function createNormalUser() {
    try {
        const permissionResponse = await request(app).post("/permissions/create").send({
            name: "User"
        }).expect(201);

        const userResponse = await request(app).post("/users/create").send({
            "email": "test.user@gmail.com",
            "password": "unit_testing",
            "confirm_password": "unit_testing",
            "id_permission": permissionResponse.body.id,
            "first_name": "Test",
            "last_name": "User"
        });

        return userResponse.body;
    } catch (error) {
        console.error('Failed to create a normal user:', error);
        throw error;
    }
}

async function authenticate(username: string) {
    const token = await request(app)
        .post("/auth/login")
        .send({
            "email": username,
            "password": "unit_testing"
        })

    return token;
}

describe("User API", () => {
    const user = {
        "email": "test.user@gmail.com",
        "password": "unit_testing",
        "confirm_password": "unit_testing",
        "id_permission": 1,
        "first_name": "Test",
        "last_name": "User"
    }

    const invalidUser = {
        "email": "invalid_email",
        "password": "unit_testing",
        "confirm_password": "unit_testing",
        "id_permission": 1,
        "first_name": "",
        "last_name": "User",
        "not_existing_field": "test"
    }

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

    it("Should get forbidden when getting a user by id without authentication", async () => {
        const response = await request(app)
            .get("/users/1")
            .expect(403);

        expect(response.body).toEqual({
            error: "Not authenticated"
        });
    })

    it("Should get forbidden when getting all the user without authentication", async () => {
        const response = await request(app)
            .get("/users/")
            .expect(403);

        expect(response.body).toEqual({
            error: "Not authenticated"
        });
    })

    it("Should get forbidden when creating a admin user without authentication", async () => {
        const response = await request(app)
            .post("/users/createAdmin")
            .send(user)
            .expect(403);

        expect(response.body).toEqual({
            error: "Not authenticated"
        })
    })

    it("Should get 404 when creating a user without a valid permission", async () => {
        const response = await request(app)
            .post("/users/create")
            .send(user)
            .expect(404);

        expect(response.body).toEqual({
            "error": "Permission not found"
        })
    })

    it("Should get 400 when trying to create a admin in the normal creation route", async () => {
        await prisma.permission.create({
            data: {
                name: "Admin"
            }
        })

        const response = await request(app)
            .post("/users/create")
            .send(user)
            .expect(400);

        expect(response.body).toEqual({
            error: "Can't create an Admin user"
        })
    })

    it("Should validate the email when creating a user", async () => {
        const response = await request(app)
            .post("/users/create")
            .send({
                ...user,
                email: "invalid_email"
            })
            .expect(400);

        expect(response.body).toEqual({
            error: "Invalid Email."
        })
    })

    it("Should return 400 when creating a user with invalid payload", async () => {
        const response = await request(app)
            .post("/users/create")
            .send(invalidUser)
            .expect(400);

        expect(response.body).toEqual({
            error: "Invalid payload provided."
        })
    })

    it("Should return 404 when getting a user by id that does not exist", async () => {
        const user = await createNormalUser() as unknown as User;

        const authenticatedUser = await authenticate(user.email);

        const response = await request(app)
            .get("/users/100")
            .set('Authorization', `Bearer ${authenticatedUser.body.token}`)
            .expect(404);

        expect(response.body).toEqual({
            error: "User not found"
        });
    })

    it("should return 200 when authenticated getting a user by id", async () => {
        const user = await createNormalUser() as unknown as User;

        const authenticatedUser = await authenticate(user.email)

        const response = await request(app)
            .get(`/users/${user.id}`)
            .set('Authorization', `Bearer ${authenticatedUser.body.token}`)
            .expect(200);

        expect(response.body.id).toEqual(user.id);
        expect(response.body.email).toEqual(user.email);
        expect(response.body.first_name).toEqual(user.first_name);
        expect(response.body.last_name).toEqual(user.last_name);
    })


    it("should return 200 when authenticated getting all the users", async () => {
        const user = await createNormalUser() as unknown as User;

        const authenticatedUser = await authenticate("test.user@gmail.com")

        const response = await request(app)
            .get("/users")
            .set('Authorization', `Bearer ${authenticatedUser.body.token}`)
            .expect(200);

        expect(response.body.length).toEqual(1);
        expect(response.body[0].id).toEqual(user.id);
        expect(response.body[0].email).toEqual(user.email);
        expect(response.body[0].first_name).toEqual(user.first_name);
        expect(response.body[0].last_name).toEqual(user.last_name);
    })

    it("Should return 201 when a user is created", async () => {
        await prisma.permission.create({
            data: {
                name: "User"
            }
        })

        const response = await request(app)
            .post("/users/create")
            .send(user)
            .expect(201);

        expect(response.body.email).toEqual(user.email);
        expect(response.body.first_name).toEqual(user.first_name);
        expect(response.body.last_name).toEqual(user.last_name);
        expect(response.body.id_permission).toEqual(user.id_permission);
    })

    it("Should return forbidden when updating a user without authentication", async () => {
        const response = await request(app)
            .put("/users/1")
            .send(user)
            .expect(403);

        expect(response.body).toEqual({
            error: "Not authenticated"
        })
    })

    it("Should return forbidden when updating a user without permission", async () => {
        const user = await createNormalUser()

        const authenticatedUser = await authenticate("test.user@gmail.com")

        const response = await request(app)
            .put(`/users/1`)
            .set('Authorization', `Bearer ${authenticatedUser.body.token}`)
            .send(user)
            .expect(403);

        expect(response.body).toEqual({
            error: "Permission denied"
        })
    })

    it("Should return 200 when a user is updated", async () => {
        const user = await createAdminUser()

        const authenticatedUser = await authenticate("test.user@gmail.com")

        const updatedUser = {
            email: "atualizando@user.com.br",
            password: "unit_testing",
            id_permission: 1,
            first_name: "Atualizando",
            last_name: "User"
        }

        const response = await request(app)
            .put(`/users/${user.id}`)
            .send(updatedUser)
            .set('Authorization', `Bearer ${authenticatedUser.body.token}`)
            .expect(200);

        expect(response.body.email).toEqual(updatedUser.email);
        expect(response.body.first_name).toEqual(updatedUser.first_name);
        expect(response.body.last_name).toEqual(updatedUser.last_name);
        expect(response.body.id_permission).toEqual(updatedUser.id_permission);
    })

    it("Should return 404 when updating a user that does not exist", async () => {
        const user = await createAdminUser()

        const authenticatedUser = await authenticate("test.user@gmail.com")

        const response = await request(app)
            .put(`/users/100`)
            .send(user)
            .set('Authorization', `Bearer ${authenticatedUser.body.token}`)
            .expect(404);

        expect(response.body).toEqual({
            error: "User not found"
        })
    })

    it("Should return 404 when deleting a user that does not exist", async () => {
        const user = await createAdminUser()

        const authenticatedUser = await authenticate("test.user@gmail.com")

        const response = await request(app)
            .delete(`/users/100`)
            .set('Authorization', `Bearer ${authenticatedUser.body.token}`)
            .expect(404);

        expect(response.body).toEqual({
            error: "User not found"
        })
    })

    it("Should return forbiden when deleting a user without authentication", async () => {
        const response = await request(app)
            .delete("/users/1")
            .expect(403);

        expect(response.body).toEqual({
            error: "Not authenticated"
        })
    })

    it("Should return forbidden when deleting a user without permission", async () => {
        const user = await createNormalUser()

        const authenticatedUser = await authenticate("test.user@gmail.com")

        const response = await request(app)
            .delete(`/users/1`)
            .set('Authorization', `Bearer ${authenticatedUser.body.token}`)
            .expect(403);

        expect(response.body).toEqual({
            error: "Permission denied"
        })
    })

    it("Should return 404 when deleting a user that does not exist", async () => {
        const user = await createAdminUser()

        const authenticatedUser = await authenticate("test.user@gmail.com")

        const response = await request(app)
            .delete(`/users/100`)
            .set('Authorization', `Bearer ${authenticatedUser.body.token}`)
            .expect(404);

        expect(response.body).toEqual({
            error: "User not found"
        })
    })

    it("Should return 200 when deleting a user sucessfully", async () => {
        const user = await createAdminUser()

        const authenticatedUser = await authenticate("test.user@gmail.com")

        const response = await request(app)
            .delete(`/users/${user.id}`)
            .set('Authorization', `Bearer ${authenticatedUser.body.token}`)
            .expect(200);

        expect(response.body.id).toEqual(1)
        expect(response.body.email).toEqual("test.user@gmail.com")
        expect(response.body.first_name).toEqual("Test")
        expect(response.body.last_name).toEqual("User")
    })

    it("Should return 400 when trying to create a user with a bad payload", async () => {
        const response = await request(app)
            .post("/users/create")
            .send(invalidUser)
            .expect(400);

        expect(response.body).toEqual({
            error: "Invalid payload provided."
        })
    })


    it("Should return 400 when trying to update a user with a bad payload", async () => {
        const user = await createAdminUser()

        const authenticatedUser = await authenticate("test.user@gmail.com")

        const response = await request(app)
            .put(`/users/${user.id}`)
            .send(invalidUser)
            .set('Authorization', `Bearer ${authenticatedUser.body.token}`)
            .expect(400);

        expect(response.body).toEqual({
            error: "Invalid payload provided."
        })
    })
})
