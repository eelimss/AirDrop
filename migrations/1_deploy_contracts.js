let TokenMock = artifacts.require("./Mock/TokenMock");
let AirDrop = artifacts.require("./airdrop/AirDrop");

module.exports = async function(deployer) {
    await deployer.deploy(TokenMock, "Name", "N", "1000000000000000000000");
    const token = TokenMock.address;
    await deployer.deploy(AirDrop, TokenMock.address);
};