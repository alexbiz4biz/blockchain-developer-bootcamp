// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

contract Exchange {
	address public feeAccount;
	uint256 public feePercent;
	mapping(address => mapping(address => uint256)) public tokens;
	mapping(uint256 => _Order) public orders;
	uint256 public orderCount;
	mapping(uint256 => bool) public orderCancelled;

	event Deposit(address token, address user, uint256 amount, uint256 balance);
	event Withdraw(address token, address user, uint256 amount, uint256 balance);
	event Order (
		// Attributers of an order
		uint256 id,
		address user,
		address tokenGet,
		uint256 amountGet,
		address tokenGive,
		uint256 amountGive,
		uint256 timestamp
	);

	event Cancel (
		// Attributers of an order
		uint256 id,
		address user,
		address tokenGet,
		uint256 amountGet,
		address tokenGive,
		uint256 amountGive,
		uint256 timestamp
	);

	// A way to model the order
	struct _Order {
		// Attributers of an order
		uint256 id;
		address user;
		address tokenGet;
		uint256 amountGet;
		address tokenGive;
		uint256 amountGive;
		uint256 timestamp;
	}


	constructor(address _feeAccount, uint256 _feePercent){
		feeAccount = _feeAccount;
		feePercent = _feePercent;
	}

	function depositToken(address _token, uint256 _amount) public {
		// Transfer tokens to exchange
		require(Token(_token).transferFrom(msg.sender, address(this), _amount));
		// Update balance
		tokens[_token][msg.sender] = tokens[_token][msg.sender] + _amount;
		// emit an event
		emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
	}


	function withdrawToken(address _token, uint256 _amount) public {
		// Ensure user has enough tokens to withdraw
		require(tokens[_token][msg.sender] >= _amount);
		// Transfer Tokens to user
		require(Token(_token).transfer(msg.sender, _amount));
		// Update exchange balance
		tokens[_token][msg.sender] = tokens[_token][msg.sender] - _amount;
		// emit an event
		emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
	}

	function balanceOf(address _token, address _user)
		public
		view
		returns (uint256)
	{
		return tokens[_token][_user];
	}

	function makeOrder(
		address _tokenGet, 
		uint256 _amountGet, 
		address _tokenGive, 
		uint256 _amountGive
	) public {
		// Prevent orders if tokens aren't on exchange
        require(balanceOf(_tokenGive, msg.sender) >= _amountGive);

		orderCount = orderCount + 1;

		orders[orderCount] = _Order(
			orderCount, 
			msg.sender,
			_tokenGet,
			_amountGet,
			_tokenGive,
			_amountGive,
			block.timestamp
		);

		emit Order(
			orderCount, 
			msg.sender,
			_tokenGet,
			_amountGet,
			_tokenGive,
			_amountGive,
			block.timestamp
		);		
	}

    function cancelOrder(uint256 _id) public {
        // Fetch order
        _Order storage _order = orders[_id];

        // Ensure the caller of the function is the owner of the order
        require(address(_order.user) == msg.sender);
        
        // Order Must Exist
        require(_order.id == _id);

        // Cancel order
        orderCancelled[_id] = true;

		emit Cancel(
			_order.id, 
			msg.sender,
			_order.tokenGet,
			_order.amountGet,
			_order.tokenGive,
			_order.amountGive,
			block.timestamp
		);		
    }

    // ------------------------------
    // EXECUTING ORDERS

    function fillOrder(uint256 _id) public {
        // Fetch order
        _Order storage _order = orders[_id];

    	// Swapping Tokens
    	_trade(
    		_order.id, 
    		_order.user,
    		_order.tokenGet,
    		_order.amountGet,
    		_order.tokenGive,
    		_order.amountGive
    	);
    }

    function _trade(
    	uint256 _orderId, 
    	address _user,
    	address _tokenGet,
    	uint256 _amountGet,
    	address _tokenGive,
    	uint256 _amountGive
    ) internal {

    	// Calculate fee
    	// Fee is paid by the use who filled the order (msg.sender)
    	// Fee is deducted from _amountGet
    	uint256 _feeAmount = (_amountGet * feePercent) / 100;

    	// Do trade Here
    	tokens[_tokenGet][msg.sender] = 
    		tokens[_tokenGet][msg.sender] - 
    		(_amountGet + _feeAmount);
    	tokens[_tokenGet][_user] = tokens[_tokenGet][user] + _amountGet;

    	// Charge fees
    	tokens[_tokenGet][_feeAccount] = 
    		tokens[_tokenGet][_feeAccount]  + 
    		_feeAmount;

    	tokens[_tokenGive][_user] = tokens[_tokenGive][_user] - _amountGive;
    	tokens[_tokenGive][msg.sender] = tokens[_tokenGive][msg.sender] + _amountGive;


    }

}
