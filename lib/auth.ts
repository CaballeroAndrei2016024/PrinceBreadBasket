import argon2 from "argon2";
import { getAuthClient } from "./mongo";

// auth helper must run on Node.js (uses native modules and MongoDB)
export const runtime = "nodejs";

export async function findUserByEmail(email: string) {
  //Find a user by their email.
  const client = await getAuthClient(); //For Lazy runtime
  return client.db().collection("users").findOne({ email });
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
  if (!/^\S+@\S+\.\S+$/.test(email))
    throw new Error("Give me an actual email!");
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
    createdAt: new Date(),
  });
  return { id: result.insertedId, email, username };
}

export async function verifyUser(email: string, password: string) {
  //Verify registrant details.
  const user = await findUserByEmail(email);
  if (!user) return null;
  const ok = await argon2.verify(user.passwordHash, password);
  if (!ok) return null;
  //Return user without hash.
  return { id: user._id, email: user.email, username: user.username ?? null };
}
