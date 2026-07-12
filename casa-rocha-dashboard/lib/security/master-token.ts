// Token do Modo Diagnóstico Interno. Usa Web Crypto (disponível no runtime edge
// do middleware E no Node dos server components/APIs), então uma só implementação
// vale para os dois. O token é um HMAC determinístico da MASTER_PASSWORD — validar
// é recalcular e comparar; a senha nunca vai para o cliente.

export const MASTER_COOKIE = "cr_master";
const TOKEN_MESSAGE = "cr-master-v1";

export function isMasterConfigured(): boolean {
  return Boolean(process.env.MASTER_PASSWORD && process.env.MASTER_PASSWORD.length >= 6);
}

async function hmac(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Buffer.from(new Uint8Array(sig)).toString("hex");
}

// Token esperado para a MASTER_PASSWORD atual.
export async function expectedToken(): Promise<string | null> {
  const pw = process.env.MASTER_PASSWORD;
  if (!pw) return null;
  return hmac(pw, TOKEN_MESSAGE);
}

export async function verifyMasterPassword(candidate: string): Promise<boolean> {
  const pw = process.env.MASTER_PASSWORD;
  if (!pw) return false;
  // Comparação em tempo ~constante sobre os hashes (mesma origem, mesmo tamanho).
  const a = await hmac(pw, candidate);
  const b = await hmac(pw, pw);
  return timingSafeEqualHex(a, b) && candidate === pw;
}

export async function verifyToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const expected = await expectedToken();
  if (!expected) return false;
  return timingSafeEqualHex(token, expected);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
