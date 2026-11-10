// Decrypts a file written by encrypt.mjs.
// Usage: APP_PASSPHRASE='...' node tools/decrypt.mjs <in.enc.json> <out.json>
// Used by the daily scan to unpack feeds.enc.json (the private feed scanner bundle) outside the repo.
import { readFileSync, writeFileSync } from "node:fs";
import { webcrypto as crypto } from "node:crypto";

const [, , inPath, outPath] = process.argv;
const pass = process.env.APP_PASSPHRASE;
if (!inPath || !outPath || !pass) {
  console.error("usage: APP_PASSPHRASE=... node tools/decrypt.mjs <in.enc.json> <out.json>");
  process.exit(2);
}
const { v, salt, iv, ct } = JSON.parse(readFileSync(inPath, "utf8"));
if (v !== 1) { console.error(`unsupported version ${v}`); process.exit(2); }
const b = (s) => Uint8Array.from(Buffer.from(s, "base64"));
const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", salt: b(salt), iterations: 250000, hash: "SHA-256" },
  base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
const plain = new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: b(iv) }, key, b(ct)));
JSON.parse(plain);
writeFileSync(outPath, plain);
console.log(`decrypted ${plain.length} bytes -> ${outPath}`);
