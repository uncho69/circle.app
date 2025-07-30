pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

template AgeVerification() {
    // Private inputs (all inputs are private by default in circom 2.x)
    signal input age;
    signal input salt;
    
    // Public inputs  
    signal input minAge; // Usually 18
    
    // Outputs
    signal output ageCommitment;
    signal output isAdult;

    // Components
    component hasher = Poseidon(2);
    component gte = GreaterEqThan(8); // Support ages up to 255
    
    // Compute age commitment = hash(age, salt)
    hasher.inputs[0] <== age;
    hasher.inputs[1] <== salt;
    ageCommitment <== hasher.out;
    
    // Check if age >= minAge
    gte.in[0] <== age;
    gte.in[1] <== minAge;
    isAdult <== gte.out;
    
    // Constraint: age must be reasonable (0-150)
    component ageRange1 = LessEqThan(8);
    component ageRange2 = GreaterEqThan(8);
    
    ageRange1.in[0] <== age;
    ageRange1.in[1] <== 150;
    ageRange1.out === 1;
    
    ageRange2.in[0] <== age;
    ageRange2.in[1] <== 0;
    ageRange2.out === 1;
}

component main = AgeVerification(); 