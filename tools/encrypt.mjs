// Encrypts the job list for the app.
// Usage: APP_PASSPHRASE='...' node tools/encrypt.mjs jobs.json data.enc.json
// jobs.json: {"lastRun":"YYYY-MM-DD","boardUrl":"...","jobs":[{...}, ...]}
// Output: {"v":1,"salt":b64,"iv":b64,"ct":b64}  AES-256-GCM, key = PBKDF2-SHA256(passphrase, salt, 250000)
import { readFileSync, writeFileSync } from "node:fs";
import { webcrypto as crypto } from "node:crypto";

const [, , inPath, outPath] = process.argv;
const pass = process.env.APP_PASSPHRASE;
if (!inPath || !outPath || !pass) {
  console.error("usage: APP_PASSPHRASE=... node tools/encrypt.mjs <in.json> <out.json>");
  process.exit(2);
}
const plain = readFileSync(inPath, "utf8");
JSON.parse(plain); // fail loudly on bad JSON

const enc = new TextEncoder();
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: 250000, hash: "SHA-256" },
  base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plain)));
const b64 = (u) => Buffer.from(u).toString("base64");
writeFileSync(outPath, JSON.stringify({ v: 1, salt: b64(salt), iv: b64(iv), ct: b64(ct) }));
console.log(`encrypted ${plain.length} bytes -> ${outPath}`);
