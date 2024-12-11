// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;


interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract Subscription {
    address public owner;
    address public usdt;
    uint256 public duration;
    mapping(address => uint256) public endOfSubscription;

    constructor(address _usdt, uint256 _duration) {
        owner = msg.sender;
        usdt = _usdt;
        duration = _duration;
    }

    function pay(uint256 _amount) public {
        IERC20(usdt).transferFrom(msg.sender, owner, _amount);
        endOfSubscription[msg.sender] = block.timestamp > endOfSubscription[msg.sender] ? block.timestamp + _amount * duration : endOfSubscription[msg.sender] + _amount * duration;
    }

    function isSubscribed(address _user) public view returns (bool) {
        return endOfSubscription[_user] > block.timestamp;
    }

    function timeLeft(address _user) public view returns (uint256) {
        return endOfSubscription[_user] > block.timestamp ? endOfSubscription[_user] - block.timestamp : 0;
    }    
}

