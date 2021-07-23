// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract AirDrop is Ownable {
    using SafeMath for uint256;

    /*     enum Status { Deposited, Dropped, Withdrawn }
    enum Currency { ETH, Tokens }

    event Transmission(Status indexed _status, Currency _currency, uint256 _amount); */

    IERC20 public token;

    modifier withoutZeroAddress(address _tokenAddress) {
        require(
            _tokenAddress != address(0),
            "Token cannot have a zero address"
        );
        _;
    }

    /*     modifier equalArrays(address[] memory _recipients, uint256[] memory _amounts) {
        require(
            _array1.length == _array2.length, 
            "The number of recipients and the number of amounts must be equal"
            );
        _;
    } */

    constructor(address _tokenAddress) withoutZeroAddress(_tokenAddress) {
        token = IERC20(_tokenAddress);
    }

    function depositTokens(address _tokenAddress) public onlyOwner {
        /*         (this).transfer(IERC20(_tokenAddress).balanceOf(this.owner()));
        IERC20(_tokenAddress) */
        IERC20(_tokenAddress).transferFrom(
            msg.sender,
            address(this),
            IERC20(_tokenAddress).balanceOf(this.owner())
        );
    }

    function depositEther() external payable onlyOwner {
        //payable(address(this)).transfer(msg.value);
    }

    function dropTokens(address[] memory _recipients, uint256 _amount)
        public
        onlyOwner
    {
        for (uint256 i = 0; i < _recipients.length; i++) {
            token.transfer(_recipients[i], _amount);
        }
    }

    /*     function dropTokens(address[] memory _recipients, uint256[] memory  _amounts)
        public
        onlyOwner
    {
         require(
            _recipients.length == _amounts.length,
            "The number of recipients and the number of amounts must be equal"
        ); 
        for (uint256 i = 0; i < _recipients.length; i++) {
            token.transfer(_recipients[i], _amounts[i]);
        }
    } */

    function dropEther(address[] memory _recipients, uint256 _amount)
        public
        onlyOwner
    {
        for (uint256 i = 0; i < _recipients.length; i++) {
            payable(_recipients[i]).transfer(_amount);
        }
    }

    /* 
    function dropEther(
        address payable[] memory _recipients,
        uint256[] memory _amounts
    ) public onlyOwner {
        require(
            _recipients.length == _amounts.length,
            "The number of recipients and the number of amounts must be equal"
        );
        for (uint256 i = 0; i < _amounts.length; i++) {
            _recipients[i].transfer(_amounts[i]);
        }
    } */

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
        require(
            IERC20(_tokenAddress).balanceOf(address(this)) > 0,
            "Token balance of AirDrop shouldn't be equal to zero"
        );
        IERC20(_tokenAddress).transfer(
            msg.sender,
            IERC20(_tokenAddress).balanceOf(address(this))
        );
    }

    function withdrawEther() public onlyOwner {
        require(
            address(this).balance > 0,
            "AirDrop has no ether"
        );
        payable(owner()).transfer(address(this).balance);
    }
}
