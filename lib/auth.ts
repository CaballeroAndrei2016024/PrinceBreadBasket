import argon2 from "argon2";
import { getAuthClient } from "./mongo";
import type { User } from "@/app/admin/types";

// auth helper must run on Node.js (uses native modules and MongoDB)
export const runtime = "nodejs";

export async function findUserByEmail(email: string) {
  //Find a user by their email.
  const client = await getAuthClient(); //For Lazy runtime
  return client.db().collection("users").findOne({ email });
}

//Find the list of all users.
export async function getAllUsers(): Promise<User[]> {
  const client = await getAuthClient();

  const users = await client
    .db()
    .collection("users")
    .find(
      {},
      {
        projection: {
          passwordHash: 0,
        },
      },
    )
    .sort({ email: 1 })
    .toArray();

  return users.map((user) => ({
    _id: user._id.toString(),
    email: user.email,
    username: user.username ?? null,
    role: user.role === "admin" ? "admin" : "user",
  }));
}

export async function registerUser({
  email,
  password,
  username,
}: {
  email: string;
  password: string;
  username?: string;
}) {
  //Validate email and password.
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error("Give me an actual email!");
  }
  if (password.length < 8 || /\s|[\x00-\x1F]/.test(password))
    throw new Error("You really are a robot, aren't you?");
  const client = await getAuthClient();
  const account = client.db().collection("users");
  await account.createIndex({ email: 1 }, { unique: true });
  const passwordHash = await argon2.hash(password);
  const result = await account.insertOne({
    email,
    username: username ?? null,
    passwordHash,
    role: "user",
    createdAt: new Date(),
  });

  return {
    id: result.insertedId,
    email,
    username,
    role: "user" as const,
  };
}

export async function verifyUser(email: string, password: string) {
  //Verify registrant details.
  const user = await findUserByEmail(email);
  if (!user) return null;
  const ok = await argon2.verify(user.passwordHash, password);
  if (!ok) return null;
  //Return user without hash.
  return {
    id: user._id,
    email: user.email,
    username: user.username ?? null,
    role: user.role ?? "user",
  };
}

//Promoting Users to Admin.
export async function promoteUserToAdmin(email: string) {
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error("Give me an actual email!");
  }

  const client = await getAuthClient();
  const users = client.db().collection("users");
  const existing = await users.findOne({ email });

  if (!existing) {
    throw new Error("No registered user found with that email.");
  }

  if (existing.role === "admin") {
    throw new Error("That user is already an admin.");
  }

  const result = await users.updateOne({ email }, { $set: { role: "admin" } });

  if (result.modifiedCount !== 1) {
    throw new Error("Unable to promote the user to admin.");
  }

  return {
    email: existing.email,
    username: existing.username ?? null,
    role: "admin" as const,
  };
}

//Demoting users from admin.
export async function demoteUserFromAdmin(email: string) {
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error("Give me an actual email!");
  }

  const client = await getAuthClient();
  const users = client.db().collection("users");

  const existing = await users.findOne({ email });

  if (!existing) {
    throw new Error("No registered user found with that email.");
  }

  if (existing.role !== "admin") {
    throw new Error("That user is already a regular user.");
  }

  const adminCount = await users.countDocuments({ role: "admin" });

  if (adminCount <= 1) {
    throw new Error("You cannot demote the last remaining admin.");
  }

  const result = await users.updateOne({ email }, { $set: { role: "user" } });

  if (result.modifiedCount !== 1) {
    throw new Error("Unable to demote the admin.");
  }

  return {
    email: existing.email,
    username: existing.username ?? null,
    role: "user" as const,
  };
}

export async function countAdmins() {
  const client = await getAuthClient();
  const users = client.db().collection("users");
  return users.countDocuments({ role: "admin" });
}

export async function createFirstAdmin({
  email,
  password,
  username,
}: {
  email: string;
  password: string;
  username?: string;
}) {
  const adminCount = await countAdmins();
  if (adminCount > 0) {
    throw new Error("An admin account already exists.");
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error("Give me an actual email!");
  }

  if (password.length < 8 || /\s|[\x00-\x1F]/.test(password)) {
    throw new Error("You really are a robot, aren't you?");
  }

  const client = await getAuthClient();
  const account = client.db().collection("users");
  await account.createIndex({ email: 1 }, { unique: true });

  const existing = await account.findOne({ email });
  if (existing) {
    if (existing.role === "admin") {
      throw new Error("An admin account already exists with that email.");
    }

    await account.updateOne({ email }, { $set: { role: "admin" } });

    return {
      id: existing._id,
      email: existing.email,
      username: existing.username ?? null,
      role: "admin" as const,
    };
  }

  const passwordHash = await argon2.hash(password);
  const result = await account.insertOne({
    email,
    username: username ?? null,
    passwordHash,
    role: "admin",
    createdAt: new Date(),
  });

  return {
    id: result.insertedId,
    email,
    username,
    role: "admin" as const,
  };
}
