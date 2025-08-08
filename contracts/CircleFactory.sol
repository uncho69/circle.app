// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * CircleFactory
 * - Incassa ETH per la creazione dei Circles
 * - Registra metadata minimi
 * - Inoltra/gestisce i fondi verso un treasury
 */
contract CircleFactory {
    address public owner;
    address public treasury; // dove inviare gli ETH raccolti
    uint256 public creationFeeWei; // costo creazione circle

    struct Circle {
        address creator;
        bytes32 id; // es. hash del nome
        uint256 createdAt;
        string metadataURI; // opzionale (ipfs)
    }

    mapping(bytes32 => Circle) public circlesById;

    event CircleCreated(address indexed creator, bytes32 indexed id, uint256 feePaid, string metadataURI);
    event TreasuryChanged(address indexed oldTreasury, address indexed newTreasury);
    event OwnerChanged(address indexed oldOwner, address indexed newOwner);
    event CreationFeeChanged(uint256 oldFee, uint256 newFee);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor(address _treasury, uint256 _creationFeeWei) {
        owner = msg.sender;
        treasury = _treasury;
        creationFeeWei = _creationFeeWei;
    }

    function setTreasury(address _treasury) external onlyOwner {
        emit TreasuryChanged(treasury, _treasury);
        treasury = _treasury;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero addr");
        emit OwnerChanged(owner, newOwner);
        owner = newOwner;
    }

    function setCreationFee(uint256 newFeeWei) external onlyOwner {
        emit CreationFeeChanged(creationFeeWei, newFeeWei);
        creationFeeWei = newFeeWei;
    }

    function createCircle(bytes32 circleId, string calldata metadataURI) external payable {
        require(msg.value >= creationFeeWei, "fee");
        require(circlesById[circleId].creator == address(0), "exists");

        circlesById[circleId] = Circle({
            creator: msg.sender,
            id: circleId,
            createdAt: block.timestamp,
            metadataURI: metadataURI
        });

        emit CircleCreated(msg.sender, circleId, msg.value, metadataURI);

        // Inoltra i fondi al treasury se impostato, altrimenti li trattiene nel contratto
        if (treasury != address(0)) {
            (bool ok, ) = treasury.call{value: address(this).balance}("");
            require(ok, "treasury xfer");
        }
    }

    // Fallback per ricevere ETH (donazioni ecc.)
    receive() external payable {}

    // Emergenza: prelievo fondi trattenuti
    function withdraw(address payable to, uint256 amount) external onlyOwner {
        require(to != address(0), "zero addr");
        require(amount <= address(this).balance, "bal");
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "withdraw fail");
    }
}

