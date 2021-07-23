// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract AirDrop is Ownable {
    using SafeMath for uint256;

    enum Currency {
        ETH,
        Tokens
    }
    enum Status {
        Deposited,
        Dropped,
        Withdrawn
    }

    event Transmission(Status status, Currency currency, uint256 amount);

    modifier withoutZeroAddress(address _tokenAddress) {
        require(
            _tokenAddress != address(0),
            "Token cannot have a zero address"
        );
        _;
    }

    IERC20 public token;

    constructor(address _tokenAddress) withoutZeroAddress(_tokenAddress) {
        token = IERC20(_tokenAddress);
    }

    function depositTokens(address _tokenAddress) public onlyOwner {
        uint256 amount = IERC20(_tokenAddress).balanceOf(this.owner());
        IERC20(_tokenAddress).transferFrom(msg.sender, address(this), amount);
        emit Transmission(Status.Deposited, Currency.Tokens, amount);
    }

    function depositEther() external payable onlyOwner {
        emit Transmission(Status.Deposited, Currency.ETH, msg.value);
    }

    function dropTokens(address[] memory _recipients, uint256 _amount)
        public
        onlyOwner
    {
        uint256 totalAmount;
        for (uint256 i = 0; i < _recipients.length; i++) {
            totalAmount = totalAmount.add(_amount);
            token.transfer(_recipients[i], _amount);
        }
        emit Transmission(Status.Dropped, Currency.Tokens, totalAmount);
    }

    function dropEther(address[] memory _recipients, uint256 _amount)
        public
        onlyOwner
    {
        uint256 totalAmount;
        for (uint256 i = 0; i < _recipients.length; i++) {
            totalAmount = totalAmount.add(_amount);
            payable(_recipients[i]).transfer(_amount);
        }
        emit Transmission(Status.Dropped, Currency.ETH, totalAmount);
    }

    function updateTokenAddress(address _tokenAddress)
        public
        onlyOwner
        withoutZeroAddress(_tokenAddress)
    {
        token = IERC20(_tokenAddress);
    }

    function withdrawTokens(address _tokenAddress)
        public
        onlyOwner
        withoutZeroAddress(_tokenAddress)
    {
        uint256 amount = IERC20(_tokenAddress).balanceOf(address(this));
        require(
            amount > 0,
            "Token balance of AirDrop shouldn't be equal to zero"
        );
        IERC20(_tokenAddress).transfer(msg.sender, amount);
        emit Transmission(Status.Withdrawn, Currency.Tokens, amount);
    }

    function withdrawEther() public onlyOwner {
        uint256 amount = address(this).balance;
        require(amount > 0, "AirDrop has no ether");
        payable(owner()).transfer(amount);
        emit Transmission(Status.Withdrawn, Currency.ETH, amount);
    }
}
