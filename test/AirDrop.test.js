const { expectEvent, expectRevert, ether, time } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = require('@openzeppelin/test-helpers/src/constants');
const BN = require('bn.js');
require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bn')(BN))
    .should();

    const AirDrop = artifacts.require("AirDrop");
    const TokenMock = artifacts.require("TokenMock");

    let token;
    let tokenName = "Name";
    let tokenSymbol = "N";
    let tokensAmount;
    let zeroAmount = new BN(0);
    let amountToSend = ether("25");
    let amountToDrop = ether("1");
    let AD;

    contract("AirDrop", function (accounts) {
        [owner, beneficiary1, beneficiary2, beneficiary3, signer] = accounts;
        beforeEach(async () => {
            tokensAmount = ether("1000");
            token = await TokenMock.new(tokenName, tokenSymbol, tokensAmount, {from: owner});
            AD = await AirDrop.new(token.address);
            await token.approve(AD.address, tokensAmount);
        });

        describe("Token Test Cases", function () {
            it('should deploy token correctly', async () => {
                (await token.name()).should.be.equal(tokenName);
                (await token.symbol()).should.be.equal(tokenSymbol);
                (await token.totalSupply()).should.be.bignumber.equal(tokensAmount);
                await token.mint(AD.address, tokensAmount, { from: owner });
            }); 
        });

        describe("AirDrop Test Cases", function () {

            it('should deploy AirDrop correctly', async () => {
                (await AD.token()).should.be.equal(token.address);
            }); 

            it('shouldn\'t deploy AirDrop if token address is a zero address', async () => {
                await expectRevert(
                    AirDrop.new(ZERO_ADDRESS), 
                    "Token cannot have a zero address");
            }); 

            it('should deposit tokens correctly', async () => {
                (await token.balanceOf(owner)).should.be.bignumber.equal(tokensAmount);
                (await token.balanceOf(AD.address)).should.be.bignumber.equal(zeroAmount);

                expectEvent(
                    await AD.depositTokens(token.address),
                    "Transmission", {
                        status: web3.utils.toBN(AirDrop.Status.Deposited), 
                        currency: web3.utils.toBN(AirDrop.Currency.Tokens), 
                        amount: tokensAmount});

                (await token.balanceOf(owner)).should.be.bignumber.equal(zeroAmount);
                (await token.balanceOf(AD.address)).should.be.bignumber.equal(tokensAmount);
            });  

            it('should deposit ether correctly', async () => {
                (await web3.eth.getBalance(AD.address)).should.be.bignumber.equal(zeroAmount);

                expectEvent(
                    await AD.depositEther({ value: amountToSend }),
                    "Transmission", {
                        status: web3.utils.toBN(AirDrop.Status.Deposited), 
                        currency: web3.utils.toBN(AirDrop.Currency.ETH), 
                        amount: amountToSend});

                (await web3.eth.getBalance(AD.address)).should.be.bignumber.equal(amountToSend);
            });  

            it('should drop tokens correctly', async () => {
                await AD.depositTokens(token.address, {from: owner});
                (await token.balanceOf(AD.address)).should.be.bignumber.equal(tokensAmount);

                let totalDroppedAmount = amountToDrop.mul(web3.utils.toBN(accounts.length));

                expectEvent(
                    await AD.dropTokens(accounts, amountToDrop, {from: owner}),
                    "Transmission", {
                        status: web3.utils.toBN(AirDrop.Status.Dropped), 
                        currency: web3.utils.toBN(AirDrop.Currency.Tokens), 
                        amount: totalDroppedAmount}); 

                (await token.balanceOf(owner)).should.be.bignumber.equal(amountToDrop);
                (await token.balanceOf(beneficiary1)).should.be.bignumber.equal(amountToDrop);
                (await token.balanceOf(beneficiary2)).should.be.bignumber.equal(amountToDrop);
                (await token.balanceOf(beneficiary3)).should.be.bignumber.equal(amountToDrop);
                (await token.balanceOf(signer)).should.be.bignumber.equal(amountToDrop);
                
                (await token.balanceOf(AD.address)).should.be.bignumber.equal(
                    tokensAmount.sub(totalDroppedAmount));
            });
 
             it('should drop ether correctly', async () => {
                await AD.depositEther({ value: amountToSend });
                (await web3.eth.getBalance(AD.address)).should.be.bignumber.equal(amountToSend);

                balanceBeneficiary1BeforeDropping = web3.utils.toBN(await web3.eth.getBalance(beneficiary1));
                balanceBeneficiary2BeforeDropping = web3.utils.toBN(await web3.eth.getBalance(beneficiary2));
                balanceBeneficiary3BeforeDropping = web3.utils.toBN(await web3.eth.getBalance(beneficiary3));
                balanceSignerBeforeDropping = web3.utils.toBN(await web3.eth.getBalance(signer));

                let totalDroppedAmount = amountToDrop.mul(web3.utils.toBN(accounts.length));

                expectEvent(
                    await AD.dropEther(accounts, amountToDrop, {from: owner}),
                    "Transmission", {
                        status: web3.utils.toBN(AirDrop.Status.Dropped), 
                        currency: web3.utils.toBN(AirDrop.Currency.ETH), 
                        amount: totalDroppedAmount}); 

                (await web3.eth.getBalance(beneficiary1)).should.be.bignumber.equal(
                    balanceBeneficiary1BeforeDropping.add(amountToDrop));

                (await web3.eth.getBalance(beneficiary2)).should.be.bignumber.equal(
                    balanceBeneficiary2BeforeDropping.add(amountToDrop));
                (await web3.eth.getBalance(beneficiary3)).should.be.bignumber.equal(
                    balanceBeneficiary3BeforeDropping.add(amountToDrop));
                (await web3.eth.getBalance(signer)).should.be.bignumber.equal(
                    balanceSignerBeforeDropping.add(amountToDrop));
                
                (await web3.eth.getBalance(AD.address)).should.be.bignumber.equal(
                    amountToSend.sub(totalDroppedAmount)); 
            }); 

            it('should update token address correctly', async () => {
                token = await TokenMock.new(tokenName, tokenSymbol, tokensAmount, {from: owner});
                await AD.updateTokenAddress(token.address);
                (await AD.token()).should.be.equal(token.address);
            }); 

            it('shouldn\'t update token address if it is a zero address', async () => {
                await expectRevert(
                    AD.updateTokenAddress(ZERO_ADDRESS),
                    "Token cannot have a zero address")
            }); 

            it('should withdraw tokens correctly', async () => {
                await AD.depositTokens(token.address, {from: owner});
                (await token.balanceOf(AD.address)).should.be.bignumber.equal(tokensAmount);
                (await token.balanceOf(owner)).should.be.bignumber.equal(zeroAmount);

                expectEvent(
                    await AD.withdrawTokens(token.address, {from: owner}),
                    "Transmission", {
                        status: web3.utils.toBN(AirDrop.Status.Withdrawn), 
                        currency: web3.utils.toBN(AirDrop.Currency.Tokens), 
                        amount: tokensAmount}); 

                (await token.balanceOf(AD.address)).should.be.bignumber.equal(zeroAmount);
                (await token.balanceOf(owner)).should.be.bignumber.equal(tokensAmount);
            });

            it('shouldn\'t withdraw tokens if token address is a zero address', async () => {
                await expectRevert(
                    AD.withdrawTokens(ZERO_ADDRESS, {from: owner}), 
                    "Token cannot have a zero address");
            });

            it('shouldn\'t withdraw tokens if AirDrop has no tokens', async () => {
                await expectRevert(
                    AD.withdrawTokens(token.address, {from: owner}), 
                    "Token balance of AirDrop shouldn't be equal to zero");
            });
 
            it('should withdraw ether correctly', async () => {
                await AD.depositEther({ value: amountToSend });
                (await web3.eth.getBalance(AD.address)).should.be.bignumber.equal(amountToSend);

                expectEvent(
                    await AD.withdrawEther({from: owner}),
                    "Transmission", {
                        status: web3.utils.toBN(AirDrop.Status.Withdrawn), 
                        currency: web3.utils.toBN(AirDrop.Currency.ETH), 
                        amount: amountToSend}); 

                (await web3.eth.getBalance(AD.address)).should.be.bignumber.equal(zeroAmount);
            }); 

            it('shouldn\'t withdraw ether if AirDrop doesn\'t have ether', async () => {
                await expectRevert(
                    AD.withdrawEther({from: owner}), 
                    "AirDrop has no ether");
            });
 
        }); 
    })