// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

contract Exchange {
	address public feeAccount, depositTokenAccountDAI;
	uint256 public feePercent;
	Token 


	constructor(address _feeAccount, uint256 _feePercent){
		feeAccount = _feeAccount;
		feePercent = _feePercent;
	}

	function depositTokens(address _token, uint256 _amount) public {
		// Transfer tokens to exchange
		Token(_token).transferFrom(msg.sender, address(this), _amount)
		// Update balance
		// emit an event
	}
}
