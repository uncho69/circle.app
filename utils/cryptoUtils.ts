// Browser-compatible crypto utilities using Web Crypto API

export interface KeyPair {
  publicKey: string
  privateKey: string
}

export interface EncryptedData {
  iv: string
  encrypted: string
  authTag?: string
}

// Generate RSA key pair using Web Crypto API (browser-compatible)
export async function generateKeyPair(): Promise<KeyPair> {
  try {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048, // Reduced from 4096 for better performance in browser
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true, // extractable
      ['encrypt', 'decrypt']
    )

    // Export keys to PEM format
    const publicKeyBuffer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey)
    const privateKeyBuffer = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey)

    const publicKey = arrayBufferToPem(publicKeyBuffer, 'PUBLIC KEY')
    const privateKey = arrayBufferToPem(privateKeyBuffer, 'PRIVATE KEY')

    return { publicKey, privateKey }
  } catch (error) {
    console.error('Key generation failed:', error)
    throw new Error('Failed to generate encryption keys')
  }
}

// Generate random bytes using Web Crypto API
export function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  window.crypto.getRandomValues(bytes)
  return bytes
}

// Hash function using Web Crypto API
export async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer)
  return arrayBufferToHex(hashBuffer)
}

// PBKDF2 key derivation using Web Crypto API
export async function deriveKey(
  password: string, 
  salt: Uint8Array, 
  iterations: number = 100000
): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)
  
  // Import password as key material
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  // Derive AES-GCM key
  return await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

// Encrypt data using AES-GCM
export async function encryptData(data: string, key: CryptoKey): Promise<EncryptedData> {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const iv = randomBytes(12) // 12 bytes for GCM

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    dataBuffer
  )

  return {
    iv: arrayBufferToHex(iv),
    encrypted: arrayBufferToHex(encryptedBuffer)
  }
}

// Decrypt data using AES-GCM
export async function decryptData(
  encryptedData: EncryptedData, 
  key: CryptoKey
): Promise<string> {
  const iv = hexToArrayBuffer(encryptedData.iv)
  const encrypted = hexToArrayBuffer(encryptedData.encrypted)

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    encrypted
  )

  const decoder = new TextDecoder()
  return decoder.decode(decryptedBuffer)
}

// Generate deterministic pseudonym from wallet address
export async function generatePseudonym(walletAddress: string): Promise<string> {
  const hash = await sha256(walletAddress.toLowerCase())
  
  const adjectives = [
    'Anonymous', 'Crypto', 'Digital', 'Stealth', 'Shadow', 'Phantom', 'Ghost', 'Cipher',
    'Quantum', 'Neural', 'Binary', 'Void', 'Echo', 'Flux', 'Zero', 'Dark'
  ]
  
  const nouns = [
    'Warrior', 'Agent', 'Trader', 'Builder', 'Hacker', 'Pioneer', 'Rebel', 'Nomad',
    'Prophet', 'Guardian', 'Cipher', 'Architect', 'Oracle', 'Knight', 'Sage', 'Phantom'
  ]
  
  const adjIndex = parseInt(hash.substring(0, 8), 16) % adjectives.length
  const nounIndex = parseInt(hash.substring(8, 16), 16) % nouns.length
  const number = parseInt(hash.substring(56, 64), 16) % 9999
  
  return `${adjectives[adjIndex]}${nouns[nounIndex]}${number.toString().padStart(4, '0')}`
}

// Utility functions for format conversion
function arrayBufferToHex(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer)
  const hexCodes = Array.from(byteArray).map(value => value.toString(16).padStart(2, '0'))
  return hexCodes.join('')
}

function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
  }
  return bytes.buffer
}

function arrayBufferToPem(buffer: ArrayBuffer, type: string): string {
  const bytes = new Uint8Array(buffer)
  const base64 = btoa(String.fromCharCode.apply(null, Array.from(bytes)))
  const pemHeader = `-----BEGIN ${type}-----`
  const pemFooter = `-----END ${type}-----`
  const pemBody = base64.match(/.{1,64}/g)?.join('\n') || base64
  
  return `${pemHeader}\n${pemBody}\n${pemFooter}`
}

// Create wallet message for signing
export function createWalletMessage(address: string, timestamp: number = Date.now()): string {
  const nonce = arrayBufferToHex(randomBytes(16).buffer)
      return `Circle Login\nAddress: ${address}\nTimestamp: ${timestamp}\nNonce: ${nonce}`
}

// Simple signature verification (for demo)
export function verifyWalletSignature(signature: string, message: string, address: string): boolean {
  return signature.length > 10 && message.includes(address)
} 