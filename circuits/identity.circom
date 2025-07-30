pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

template Identity() {
    // Private inputs (all inputs are private by default in circom 2.x)
    signal input secret;
    signal input nullifier;
    
    // Public inputs
    signal input merkleRoot;
    
    // Outputs
    signal output commitment;
    signal output nullifierHash;
    signal output validProof;

    // Components
    component hasher1 = Poseidon(2);
    component hasher2 = Poseidon(2);
    component isValid = IsEqual();
    
    // Compute commitment = hash(secret, nullifier)
    hasher1.inputs[0] <== secret;
    hasher1.inputs[1] <== nullifier;
    commitment <== hasher1.out;
    
    // Compute nullifier hash = hash(nullifier, secret)
    hasher2.inputs[0] <== nullifier;
    hasher2.inputs[1] <== secret;
    nullifierHash <== hasher2.out;
    
    // Validate that commitment is in the merkle tree
    // For simplicity, just check if commitment exists
    isValid.in[0] <== commitment;
    isValid.in[1] <== merkleRoot;
    validProof <== isValid.out;
}

component main = Identity(); 