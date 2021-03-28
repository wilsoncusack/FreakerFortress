
const { expect } = require("chai");

describe("FreakerFortress contract", function () {

	let EtherFreakers
	let Fortress

	beforeEach(async function () {
		[owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();	

	    let EtherFreakersContract = await ethers.getContractFactory("EtherFreakers");
	    let FortressContract = await ethers.getContractFactory("FreakerFortress");
	    let FreakerAttackContract = await ethers.getContractFactory("FreakerAttack");

	    EtherFreakers = await EtherFreakersContract.deploy(addr1.address);
	    await EtherFreakers.deployed();
	    

	    Fortress = await FortressContract.deploy(addr2.address, EtherFreakers.address);
	    await Fortress.deployed();
  	});	


	describe("depositFreaker", function () {
		it("fails if fee is too low", async function(){
			await EtherFreakers.connect(addr2).birth({value: Math.pow(10, 18) + ""})
			await expect(
				Fortress.connect(addr2).depositFreaker(addr2.address, "8")
				).to.be.revertedWith("FreakerFortress: Join fee too low");
			const balance = await Fortress.balanceOf(addr2.address)
			expect(balance).to.equal(0)
		});

		it("fails if freak does not exist", async function(){
			await expect(
				Fortress.connect(addr2).depositFreaker(addr2.address, "8", {value: Math.pow(10, 18) + ""})
				).to.be.revertedWith("ERC721: operator query for nonexistent token");
			const balance = await Fortress.balanceOf(addr2.address)
			expect(balance).to.equal(0)
		});

		it("fails if contract is not approved", async function(){
			await EtherFreakers.connect(addr2).birth({value: Math.pow(10, 18) + ""})

			await expect(
				Fortress.connect(addr2).depositFreaker(addr2.address, "8", {value: Math.pow(10, 18) + ""})
				).to.be.revertedWith("ERC721: transfer caller is not owner nor approved");
			const balance = await Fortress.balanceOf(addr2.address)
			expect(balance).to.equal(0)
		});

		it("gives msg.sender a new token in the fortress", async function(){
			await EtherFreakers.connect(addr2).birth({value: Math.pow(10, 18) + ""})
			await EtherFreakers.connect(addr2).approve(Fortress.address, "8")

			await expect(
				Fortress.connect(addr2).depositFreaker(addr2.address, "8", {value: Math.pow(10, 18) + ""})
				).not.to.be.reverted
			const balance = await Fortress.balanceOf(addr2.address)
			expect(balance).to.equal(1)
			const owner = await Fortress.ownerOf("8")
			expect(owner).to.equal(addr2.address)
		});

		it("transfers token to the contract", async function(){
			await EtherFreakers.connect(addr2).birth({value: Math.pow(10, 18) + ""})
			await EtherFreakers.connect(addr2).approve(Fortress.address, "8")

			await Fortress.connect(addr2).depositFreaker(addr2.address, "8", {value: Math.pow(10, 17) + ""})
			const balance = await EtherFreakers.balanceOf(Fortress.address)
			expect(balance).to.equal(1)
			const owner = await EtherFreakers.ownerOf("8")
			expect(owner).to.equal(Fortress.address)
		});
	});

	describe("withdrawFreaker", function () {
		it("does not allow if does not own freaker", async function(){
			await EtherFreakers.connect(addr2).birth({value: Math.pow(10, 18) + ""})
			await EtherFreakers.connect(addr2).approve(Fortress.address, "8")

			await Fortress.connect(addr2).depositFreaker(addr2.address, "8", {value: Math.pow(10, 17) + ""})
			await expect(
				Fortress.connect(addr1).withdrawFreaker(addr1.address, "8")
				).to.be.revertedWith("FreakerFortress: caller is not owner nor approved")
		});

		it("transfers to caller", async function(){
			await EtherFreakers.connect(addr2).birth({value: Math.pow(10, 18) + ""})
			await EtherFreakers.connect(addr2).approve(Fortress.address, "8")

			await Fortress.connect(addr2).depositFreaker(addr2.address, "8", {value: Math.pow(10, 17) + ""})
			await expect(
				Fortress.connect(addr2).withdrawFreaker(addr2.address, "8")
				).to.not.be.reverted

			const owner = await EtherFreakers.ownerOf("8")
			expect(owner).to.equal(addr2.address)
		});
	})

	describe("remoteAttack", function () {
		it("attacks", async function(){

			await Fortress.connect(addr2).createAttackContract()
			// #8
			await EtherFreakers.connect(addr3).birth({value: Math.pow(10, 15) + ""})
			// #9
			await EtherFreakers.connect(addr2).birth({value: Math.pow(10, 16) + ""})
			await EtherFreakers.connect(addr2).charge("9", {value: ethers.BigNumber.from("10").pow("20")})
			// #10
			await EtherFreakers.connect(addr2).birth({value: Math.pow(10, 17) + ""})
			// #11
			await EtherFreakers.connect(addr2).birth({value: Math.pow(10, 18) + ""})
			// #12
			await EtherFreakers.connect(addr2).birth({value: Math.pow(10, 19) + ""})

			await EtherFreakers.connect(addr2).approve(Fortress.address, "12")
			await EtherFreakers.connect(addr2).approve(Fortress.address, "9")
			await EtherFreakers.connect(addr2).approve(Fortress.address, "10")
			await EtherFreakers.connect(addr2).approve(Fortress.address, "11")
			await Fortress.connect(addr2).depositFreaker(addr2.address, "12", {value: Math.pow(10, 17) + ""})
			await Fortress.connect(addr2).depositFreaker(addr2.address, "9", {value: Math.pow(10, 17) + ""})
			await Fortress.connect(addr2).depositFreaker(addr2.address, "10", {value: Math.pow(10, 17) + ""})
			await Fortress.connect(addr2).depositFreaker(addr2.address, "11", {value: Math.pow(10, 17) + ""})
			
			await expect(
				await Fortress.connect(addr1).remoteAttack(["12", "9", "10", "11"], "9", "8", {value: Math.pow(10, 18) + ""})
			).to.emit(EtherFreakers, "Captured")

			const owner = await EtherFreakers.ownerOf("8")
			expect(owner).to.equal(Fortress.address)

			const ownerInFortress = await Fortress.ownerOf("8")
			expect(ownerInFortress).to.equal(addr1.address)
		});

		it("attacks at lower gas", async function(){

			await Fortress.connect(addr2).createAttackContract()
			// #8
			await EtherFreakers.connect(addr3).birth({value: Math.pow(10, 15) + ""})
			// #9
			await EtherFreakers.connect(addr2).birth({value: ethers.BigNumber.from("10").pow("20")})
			
			await EtherFreakers.connect(addr2).approve(Fortress.address, "9")
			await Fortress.connect(addr2).depositFreaker(addr2.address, "9", {value: Math.pow(10, 17) + ""})

			await expect(
				await Fortress.connect(addr1).remoteAttack(["9"], "9", "8", {value: Math.pow(10, 18) + ""})
			).to.emit(EtherFreakers, "Captured")
		});

		it("returns the freaker", async function(){

			await Fortress.connect(addr2).createAttackContract()
			// #8
			await EtherFreakers.connect(addr3).birth({value: Math.pow(10, 15) + ""})
			// #9
			await EtherFreakers.connect(addr2).birth({value: ethers.BigNumber.from("10").pow("20")})
			
			await EtherFreakers.connect(addr2).approve(Fortress.address, "9")
			await Fortress.connect(addr2).depositFreaker(addr2.address, "9", {value: Math.pow(10, 17) + ""})

			await Fortress.connect(addr1).remoteAttack(["9"], "9", "8", {value: Math.pow(10, 18) + ""})

			const owner = await EtherFreakers.ownerOf("9")
			expect(owner).to.equal(Fortress.address)
			
		});
	});

	describe("claimToken", function () {
		it("cannot claim after a deposit", async function(){
			await EtherFreakers.connect(addr2).birth({value: Math.pow(10, 18) + ""})
			await EtherFreakers.connect(addr2).approve(Fortress.address, "8")

			await Fortress.connect(addr2).depositFreaker(addr2.address, "8", {value: Math.pow(10, 17) + ""})
			await expect(
				Fortress.connect(addr2).claimToken(addr2.address, "8")
				).to.be.revertedWith("FreakerFortress: token has owner")
		});

		it("can claim after transfer", async function(){
			await EtherFreakers.connect(addr2).birth({value: Math.pow(10, 18) + ""})
			await EtherFreakers.connect(addr2).transferFrom(addr2.address, Fortress.address, 8)

			await expect(
				Fortress.connect(addr2).claimToken(addr2.address, "8")
				).not.to.be.reverted
		});

		// it("does impound if transferred", async function(){
		// 	await EtherFreakers.connect(addr2).birth({value: Math.pow(10, 18) + ""})
		// 	await EtherFreakers.connect(addr2).safeTransferFrom(addr2.address, Fortress.address, 8)

		// 	const impounded = await Fortress.impoundedTokens("8")
		// 	expect(impounded.from).to.equal("0x0000000000000000000000000000000000000000")
		// });
	})

	describe("updateJoinFee", function () {
		it("does not allow non manager to call", async function(){
			await expect(
				Fortress.connect(addr1).updateJoinFee(54)
				).to.be.revertedWith("FreakerFortress: caller is not owner nor approved")
		})
	})

});