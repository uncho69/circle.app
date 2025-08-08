const circomlib = require("circomlib");
const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const CIRCUITS_DIR = path.join(__dirname, "../circuits");
const BUILD_DIR = path.join(__dirname, "../public/circuits");
const PTAU_MIRRORS = [
  "https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_15.ptau",
  "https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_15.ptau",
  "https://github.com/iden3/snarkjs-test-data/raw/master/powersOfTau28_hez_final_15.ptau",
  "https://raw.githubusercontent.com/iden3/snarkjs-test-data/master/powersOfTau28_hez_final_15.ptau"
];

async function downloadPowerOfTau() {
  const ptauPath = path.join(BUILD_DIR, "powersOfTau28_hez_final_15.ptau");

  // If file exists but is clearly too small, re-download
  if (fs.existsSync(ptauPath)) {
    try {
      const stats = fs.statSync(ptauPath);
      // Real ptau is ~100MB+. If < 1MB, treat as corrupt/placeholder
      if (stats.size > 1_000_000) {
        console.log("✅ Powers of Tau file already exists");
        return ptauPath;
      }
      console.warn("⚠️ Detected small/corrupt Powers of Tau file. Re-downloading...");
      fs.unlinkSync(ptauPath);
    } catch (e) {
      console.warn("⚠️ Could not stat/delete existing ptau, will re-download:", e.message);
    }
  }

  console.log("📥 Downloading Powers of Tau file...");

  let lastErr = null;
  for (const url of PTAU_MIRRORS) {
    try {
      console.log(`  → Trying ${url}`);
      execSync(`curl -L --fail --retry 3 --retry-delay 2 ${url} -o ${ptauPath}`, { stdio: 'inherit' });
      const stats = fs.statSync(ptauPath);
      if (stats.size > 1_000_000) {
        console.log("✅ Powers of Tau downloaded successfully");
        return ptauPath;
      }
      console.warn(`⚠️ Downloaded file too small (${stats.size} bytes), trying next mirror...`);
    } catch (error) {
      lastErr = error;
      console.warn(`⚠️ Mirror failed: ${url} -> ${error.message}`);
    }
  }

  console.error("❌ Failed to download a valid Powers of Tau file from all mirrors");
  if (lastErr) throw lastErr;
  throw new Error("No valid ptau mirrors");
}

async function compileCircuit(circuitName) {
  console.log(`\n🔧 Compiling circuit: ${circuitName}`);
  
  const circuitPath = path.join(CIRCUITS_DIR, `${circuitName}.circom`);
  const buildPath = path.join(BUILD_DIR, circuitName);
  const wasmPath = path.join(buildPath, `${circuitName}.wasm`);
  const r1csPath = path.join(buildPath, `${circuitName}.r1cs`);
  
  // Create build directory
  if (!fs.existsSync(buildPath)) {
    fs.mkdirSync(buildPath, { recursive: true });
  }

  try {
    // Step 1: Compile circuit to WASM and R1CS (skip if already present)
    let needCompile = true;
    if (fs.existsSync(wasmPath) && fs.existsSync(r1csPath)) {
      console.log(`  ✅ Found existing WASM and R1CS for ${circuitName}, skipping circom compile`);
      needCompile = false;
    }

    if (needCompile) {
      console.log(`  📦 Compiling ${circuitName}.circom...`);
      execSync(`circom ${circuitPath} --r1cs --wasm --sym -o ${buildPath} -l ./node_modules`, { stdio: 'inherit' });

      // Move WASM file to correct location
      const generatedWasmDir = path.join(buildPath, `${circuitName}_js`);
      const generatedWasmFile = path.join(generatedWasmDir, `${circuitName}.wasm`);

      if (fs.existsSync(generatedWasmFile)) {
        fs.copyFileSync(generatedWasmFile, wasmPath);
        console.log(`  ✅ WASM compiled: ${wasmPath}`);
      }
    }

    // Step 2: Generate trusted setup
    console.log(`  🔑 Generating trusted setup...`);
    const ptauPath = await downloadPowerOfTau();
    const zkeyPath = path.join(buildPath, `${circuitName}_0000.zkey`);
    const finalZkeyPath = path.join(buildPath, `${circuitName}_final.zkey`);
    
    // Phase 1: Setup
    if (!fs.existsSync(finalZkeyPath)) {
      await snarkjs.zKey.newZKey(r1csPath, ptauPath, zkeyPath);
      console.log(`  ✅ Phase 1 setup complete`);
    
      // Phase 2: Contribute (simulate ceremony)
      await snarkjs.zKey.contribute(zkeyPath, finalZkeyPath, circuitName, "Decentra contribution");
      console.log(`  ✅ Phase 2 contribution complete`);
    } else {
      console.log(`  ✅ Found existing final zkey, skipping ceremony`);
    }
    
    // Step 3: Export verification key
    const vkeyPath = path.join(buildPath, `${circuitName}_verification_key.json`);
    const vKey = await snarkjs.zKey.exportVerificationKey(finalZkeyPath);
    fs.writeFileSync(vkeyPath, JSON.stringify(vKey, null, 2));
    console.log(`  ✅ Verification key exported: ${vkeyPath}`);
    
    // Step 4: Generate Solidity verifier (optional)
    try {
      const solidityPath = path.join(buildPath, `${circuitName}Verifier.sol`);
      const solidityCode = await snarkjs.zKey.exportSolidityVerifier(finalZkeyPath);
      fs.writeFileSync(solidityPath, solidityCode);
      console.log(`  ✅ Solidity verifier generated: ${solidityPath}`);
    } catch (error) {
      console.warn(`  ⚠️ Solidity verifier generation failed:`, error.message);
    }

    console.log(`✅ Circuit ${circuitName} compiled successfully!`);
    
    return {
      wasm: wasmPath,
      zkey: finalZkeyPath,
      vkey: vkeyPath,
      r1cs: r1csPath
    };
    
  } catch (error) {
    console.error(`❌ Failed to compile circuit ${circuitName}:`, error.message);
    throw error;
  }
}

async function compileAllCircuits() {
  console.log("🚀 Starting ZK-SNARK circuit compilation...\n");
  
  // Ensure build directory exists
  if (!fs.existsSync(BUILD_DIR)) {
    fs.mkdirSync(BUILD_DIR, { recursive: true });
  }

  const circuits = [
    // Compiliamo solo identity per ora (age richiede circom installato). 
    // Aggiungere altri circuiti quando l'ambiente è pronto.
    "identity"
  ];

  const results = {};

  for (const circuit of circuits) {
    try {
      results[circuit] = await compileCircuit(circuit);
    } catch (error) {
      console.error(`Failed to compile ${circuit}:`, error);
      process.exit(1);
    }
  }

  // Generate circuit registry
  const registryPath = path.join(BUILD_DIR, "circuits.json");
  const registry = {
    compiled: new Date().toISOString(),
    circuits: results
  };
  
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
  console.log(`\n📋 Circuit registry created: ${registryPath}`);
  
  console.log("\n🎉 All circuits compiled successfully!");
  console.log("📁 Files are available in:", BUILD_DIR);
  
  return results;
}

// Run if called directly
if (require.main === module) {
  compileAllCircuits()
    .then(() => {
      console.log("\n✅ Compilation complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Compilation failed:", error);
      process.exit(1);
    });
}

module.exports = { compileCircuit, compileAllCircuits }; 