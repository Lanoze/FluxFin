import { Client } from "pg";

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

let connected = false;

async function getClient() {
  if (!connected) {
    await client.connect();
    connected = true;
  }
  return client;
}

export { getClient };
