import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createPrivateKey, createPublicKey, generateKeyPairSync } from "node:crypto";
import { randomUUID } from "node:crypto";

export const GIT_SSH_KEY_SECRET_NAME = "_paperclip_git_ssh_key";

export function isGitSshUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return trimmed.startsWith("git@") || trimmed.startsWith("ssh://");
}

export function generateGitSshKeyPair(comment: string): { privateKeyPem: string; publicKeyOpenSsh: string } {
  const { privateKey } = generateKeyPairSync("ed25519", {
    privateKeyEncoding: { format: "pem", type: "pkcs8" },
  });
  const privateKeyPem = privateKey as unknown as string;
  return {
    privateKeyPem,
    publicKeyOpenSsh: deriveGitSshPublicKey(privateKeyPem, comment),
  };
}

export function deriveGitSshPublicKey(privateKeyPem: string, comment = "paperclip"): string {
  const privKey = createPrivateKey(privateKeyPem);
  const pubKey = createPublicKey(privKey);
  const spkiDer = pubKey.export({ type: "spki", format: "der" }) as Buffer;
  // Ed25519 SPKI DER layout: 30 2A 30 05 06 03 2B 65 70 03 21 00 <32-byte key material>
  // The 32-byte raw public key starts at byte offset 12.
  const keyMaterial = spkiDer.slice(12);
  const algName = "ssh-ed25519";
  const algBuf = Buffer.from(algName, "ascii");
  const wire = Buffer.allocUnsafe(4 + algBuf.length + 4 + keyMaterial.length);
  wire.writeUInt32BE(algBuf.length, 0);
  algBuf.copy(wire, 4);
  wire.writeUInt32BE(keyMaterial.length, 4 + algBuf.length);
  keyMaterial.copy(wire, 8 + algBuf.length);
  return `${algName} ${wire.toString("base64")} ${comment}`;
}

export async function withGitSshEnv<T>(
  privateKeyPem: string,
  fn: (env: NodeJS.ProcessEnv) => Promise<T>,
): Promise<T> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "paperclip-sshkey-"));
  const keyPath = path.join(dir, randomUUID());
  try {
    await fs.writeFile(keyPath, privateKeyPem, { mode: 0o600 });
    const sshCommand = [
      "ssh",
      "-i", keyPath,
      "-o", "StrictHostKeyChecking=no",
      "-o", "UserKnownHostsFile=/dev/null",
      "-o", "IdentitiesOnly=yes",
    ].join(" ");
    return await fn({ GIT_SSH_COMMAND: sshCommand });
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}
