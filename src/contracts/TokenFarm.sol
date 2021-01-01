pragma solidity ^0.6.0;

import "./DappToken.sol";
import "./DaiToken.sol";
import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";

contract TokenFarm {
    string public name = "Dapp Token Farm";
    address public owner;
    DaiToken public daiToken;
    DappToken public dappToken;

    mapping(address => uint256) public stakingBalance;
    mapping(address => bool) public hasStaked;
    mapping(address => bool) public isStaking;

    address[] public stakers;

    constructor(DappToken _dappToken, DaiToken _daiToken) public {
        dappToken = _dappToken;
        daiToken = _daiToken;
        owner = msg.sender;
    }

    // 1. Stake Tokens

    function stakeTokens(uint256 _amount) public {
        require(_amount > 0, "amount cannot be lessthan 0");

        daiToken.transferFrom(msg.sender, address(this), _amount);

        stakingBalance[msg.sender] = stakingBalance[msg.sender] + _amount;

        if (!hasStaked[msg.sender]) {
            stakers.push(msg.sender);
        }

        hasStaked[msg.sender] = true;
        isStaking[msg.sender] = true;
    }

    // 2. unStake Tokens
    function unstakeTokens() public {
        uint256 balance = stakingBalance[msg.sender];

        require(balance > 0, "You have no Tokens to unStake mDai");
        stakingBalance[msg.sender] = 0;
        daiToken.transfer(msg.sender, balance);
        isStaking[msg.sender] = false;
    }

    // 3. issue Tokens
    function issueTokens() public {
        require(msg.sender == owner, "you are not the owner");
        for (uint256 i = 0; i < stakers.length; i++) {
            address recipient = stakers[i];
            uint256 balance = stakingBalance[recipient];
            if (balance > 0) {
                dappToken.transfer(recipient, getCalculatedBalance() * balance);
            }
        }
    }

    function getCalculatedBalance() public view returns (uint256) {
        AggregatorV3Interface priceFeed =
            AggregatorV3Interface(0x777A68032a88E5A84678A77Af2CD65A7b3c0775a);
        (
            uint80 roundID,
            int256 price,
            uint256 startedAt,
            uint256 timeStamp,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        return uint256(price);
    }
}
