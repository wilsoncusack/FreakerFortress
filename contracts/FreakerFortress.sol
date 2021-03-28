pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./EtherFreakers.sol";
import "./FreakerAttack.sol";


contract FreakerFortress is ERC721, IERC721Receiver {

	address public manager;
	uint128 public joinFeeWei = 1e17;
	uint128 public attackFeeWei = 5e17;
	address public etherFreakersAddress;
	address public attackContract;
	uint8 public maxRemoteAttackers = 4;

	constructor(address author, address _etherFreakersAddress) ERC721("FreakerFortress", "FEFKR") {
        manager = author;
        etherFreakersAddress = _etherFreakersAddress;
    }

    modifier ownerOrApproved(uint128 freakerID) { 
    	require(_isApprovedOrOwner(msg.sender, freakerID), "FreakerFortress: caller is not owner nor approved");
    	_; 
    }

    modifier managerOnly() { 
    	require(msg.sender == manager, "FreakerFortress: caller is not owner nor approved");
    	_; 
    }
    

    function depositFreaker(address mintTo, uint128 freakerID) payable external {
        require(msg.value >= joinFeeWei, "FreakerFortress: Join fee too low");
        EtherFreakers(etherFreakersAddress).transferFrom(msg.sender, address(this), freakerID);
        _safeMint(mintTo, freakerID, "");
    }

    // attack contract only 
    function depositFreakerFree(address mintTo, uint128 freakerID) payable external {
        require(msg.sender == attackContract, "FreakerFortress: Attack contract only");
        EtherFreakers(etherFreakersAddress).transferFrom(msg.sender, address(this), freakerID);
        _safeMint(mintTo, freakerID, "");
    }


    function withdrawFreaker(address to, uint128 freakerID) payable external ownerOrApproved(freakerID) {
        _burn(freakerID);
        EtherFreakers(etherFreakersAddress).safeTransferFrom(address(this), to, freakerID);
    }

    // NOTE: will not work if fortress has elightenment. Use remoteAttack
    function attack(uint128 sourceId, uint128 targetId) public ownerOrApproved(sourceId) returns (bool) {
        require(!EtherFreakers(etherFreakersAddress).isEnlightened(targetId), "FreakerFortress: target is enlightened");
        bool success = EtherFreakers(etherFreakersAddress).attack(sourceId, targetId);
        if(success){
        	_safeMint(msg.sender, targetId, "");
        }
        return success;
    }
    

    function discharge(uint128 freakerID, uint128 amount) public ownerOrApproved(freakerID) {
        address owner = ownerOf(freakerID);
        // calculate what the contract will be paid before we call
        uint128 energy = EtherFreakers(etherFreakersAddress).energyOf(freakerID);
        uint128 capped = amount > energy ? energy : amount;
        EtherFreakers(etherFreakersAddress).discharge(freakerID, amount);
        payable(owner).transfer(capped);
    }

    function charge(uint128 freakerID) payable ownerOrApproved(freakerID) public {
       EtherFreakers(etherFreakersAddress).charge{value: msg.value}(freakerID);
    }

    function tap(uint128 creatorId) public {
    	require(EtherFreakers(etherFreakersAddress).ownerOf(creatorId) == address(this), "FreakerFortress: Fortress does not own token");
    	// calculate how much will be paid to the fortress
        uint128 basic;
        uint128 index;
        (basic, index) = EtherFreakers(etherFreakersAddress).energyBalances(creatorId);
        uint128 unclaimed = EtherFreakers(etherFreakersAddress).creatorIndex() - index;
        EtherFreakers(etherFreakersAddress).tap(creatorId);
        // pay to the token holder in the fortress
        address owner = ownerOf(creatorId);
        payable(owner).transfer(unclaimed);
    }


    function tokenURI(uint256 tokenID) public view virtual override returns (string memory) {
        return EtherFreakers(etherFreakersAddress).tokenURI(tokenID);
    }

    function onERC721Received(address from, address to, uint256 freakerID, bytes memory) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    // this is to handle tokens sent to the contract 
    function claimToken(address to, uint256 freakerID) payable external {
        require(!_exists(freakerID), "FreakerFortress: token has owner");
        require(EtherFreakers(etherFreakersAddress).ownerOf(freakerID) == address(this), "FreakerFortress: fortress does not own token");
    	_safeMint(to, freakerID, "");
    }

    // remote attack 

    function createAttackContract() external {
    	require(attackContract == address(0), "FreakerFortress: attack contract already exists");
    	attackContract = address(new FreakerAttack(address(this), etherFreakersAddress)); 
    }

    function remoteAttack(uint128[] calldata freakers, uint128 sourceId, uint128 targetId) external payable returns(bool) {
    	require(msg.value >= attackFeeWei, "FreakerFortress: Attack fee too low");
        require(attackContract != address(0), "FreakerFortress: attack contract does not exist");
    	require(EtherFreakers(etherFreakersAddress).ownerOf(targetId) != address(this), "FreakerFortress: cannot attack freak in fortress");
    	require(!EtherFreakers(etherFreakersAddress).isEnlightened(targetId), "FreakerFortress: target is enlightened");
    	require(freakers.length <= maxRemoteAttackers, "FreakerFortress: too many attackers");
    	for(uint i=0; i < freakers.length; i++){
			EtherFreakers(etherFreakersAddress).transferFrom(address(this), attackContract, freakers[i]);
		}
		bool response = FreakerAttack(attackContract).attack(msg.sender, sourceId, targetId);
		FreakerAttack(attackContract).sendBack(freakers);
		return response;
    }

    // owner methods

    function updateFightFee(uint128 _fee) external managerOnly {
        attackFeeWei = _fee;
    }

    function updateJoinFee(uint128 _fee) external managerOnly {
        joinFeeWei = _fee;
    }

    function updateManager(address _manager) external managerOnly {
        manager = _manager;
    }

    function updateMaxRemoteAttackers(uint8 count) external managerOnly {
        maxRemoteAttackers = count;
    }


}