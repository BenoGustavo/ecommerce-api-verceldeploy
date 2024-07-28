import request from 'supertest';
import app from '@/main';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);

const prisma = new PrismaClient();

describe("product API", () => {
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

  it("should get 404 when getting a product by id that don't exits", async () => {

    const response = await request(app)
      .get("/products/1")
      .expect(404);

    expect(response.body).toEqual({
      error: "Product not found"
    });
  });

  it("should get 404 when getting all products with no product created", async () => {

    const response = await request(app)
      .get("/products")
      .expect(404);

    expect(response.body).toEqual({
      error: "No products found"
    });
  })

  it("should return 400 when inserting a product with a negative value", async () => {
    const product = {
      name: "Product 1",
      value: -10,
      stock: 10
    }

    const response = await request(app)
      .post("/products/create")
      .send(product)
      .expect(400);

    expect(response.body).toEqual({
      error: "invalid payload provided."
    });
  })

  it("should return 400 when inserting a product with a negative stock", async () => {
    const product = {
      name: "Product 1",
      value: 10,
      stock: -10
    }

    const response = await request(app)
      .post("/products/create")
      .send(product)
      .expect(400);

    expect(response.body).toEqual({
      error: "invalid payload provided."
    });
  })

  it("should return 400 when creating a product with an empty name", async () => {
    const product = {
      name: "",
      value: 10,
      stock: 10
    }

    const response = await request(app)
      .post("/products/create")
      .send(product)
      .expect(400);

    expect(response.body).toEqual({
      error: "invalid payload provided."
    });
  })
})

it("should return 404 when updating a product that don't exits", async () => {
  const product = {
    name: "Product 1",
    value: 10,
    stock: 10
  }

  const response = await request(app)
    .put("/products/1")
    .send(product)
    .expect(404);

  expect(response.body).toEqual({
    error: "Product not found"
  });
})

it("should return 404 when deleting a product that don't exits", async () => {
  const response = await request(app)
    .delete("/products/1")
    .expect(404);

  expect(response.body).toEqual({
    error: "Product not found"
  });
})

it("should create a product", async () => {
  const product = {
    name: "Product 1",
    value: 10,
    stock: 10
  }

  const response = await request(app)
    .post("/products/create")
    .send(product)
    .expect(201);

  expect(response.body.id).toEqual(1);
  expect(response.body.name).toEqual("Product 1");
  expect(response.body.value).toEqual(10);
  expect(response.body.stock).toEqual(10);
})

it("should update a product", async () => {
  const product = {
    name: "Product 1",
    value: 10,
    stock: 10
  }

  await request(app)
    .post("/products/create")
    .send(product)
    .expect(201);

  const updatedProduct = {
    name: "Product 2",
    value: 20,
    stock: 20
  }

  const response = await request(app)
    .put("/products/1")
    .send(updatedProduct)
    .expect(200);

  expect(response.body.id).toEqual(1);
  expect(response.body.name).toEqual("Product 2");
  expect(response.body.value).toEqual(20);
  expect(response.body.stock).toEqual(20);
})

it("should delete a product", async () => {
  const product = {
    name: "Product 1",
    value: 10,
    stock: 10
  }

  await request(app)
    .post("/products/create")
    .send(product)
    .expect(201);

  const response = await request(app)
    .delete("/products/1")
    .expect(200);

  expect(response.body).toEqual({});
})