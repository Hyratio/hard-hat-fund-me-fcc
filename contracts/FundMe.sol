// SPDX-License-Identifier: MIT
// o PRAGMA_____________
pragma solidity ^0.8.7;
// o IMPORTS___________
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

/*we need some changes here */
// o ERROR CODES_________________ we have to write the name of the contract first followed by 2 underscores
error FundMe__NotOwner();

// o INTERFACES, LIBRARIES, CONTRACTS_________

/**@title A contract for crowd funding
 * @author Hyratio
 * @notice This contract is to demo a sample funding contract
 * @dev This implement price feeds as our libraries
 * this is helpful to create automatic documentation by typing "solc --userdoc --devdoc File.sol"
 * documentation can be useful to other devs that interacts with the protocol
 */

contract FundMe {
    // o TYPE DECLARATIONS_____________________________________________
    using PriceConverter for uint256;

    // o STATE VARIABLES________________________________________________
    mapping(address => uint256) private s_addressToAmountFunded;
    address[] private s_funders;

    // Could we make this constant?  /* hint: no! We should make it immutable! */
    address private immutable i_owner;
    uint256 public constant MINIMUM_USD = 50 * 10 ** 18;

    AggregatorV3Interface private s_priceFeed;

    // o MODIFIERS______________________________________________________
    modifier onlyOwner() {
        // require(msg.sender == owner);
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _;
    }

    // o FUNCTION ORDER:_____________________________________________
    //// Contructor
    //// receive
    //// fallback
    //// external
    //// internal
    //// private
    //// view/pure

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    /**
     * @notice this function funds the contract
     * @dev this implements price feeds in our library | (@)param (if we have them) what they are | (@)return (if we have it)
     */
    function fund() public payable {
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "You need to spend more ETH!"
        );
        // require(PriceConverter.getConversionRate(msg.value) >= MINIMUM_USD, "You need to spend more ETH!");
        s_addressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender);
    }

    // function getVersion() public view returns (uint256){
    //     // ETH/USD price feed address of Sepolia Network.
    //     AggregatorV3Interface s_priceFeed = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
    //     return priceFeed.version();
    // }

    function withdraw() public onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);

        // // transfer
        // payable(msg.sender).transfer(address(this).balance);
        // // send
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "Send failed");
        // call
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders;

        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success);
    }

    // o VIEW/PURE FUNCTIONS_________________________________________

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getfunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getaddressToAmountFunded(
        address funder
    ) public view returns (uint256) {
        return s_addressToAmountFunded[funder];
    }

    function getpriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }

    // Explainer from: https://solidity-by-example.org/fallback/
    // Ether is sent to contract
    //      is msg.data empty?
    //          /   \
    //         yes  no
    //         /     \
    //    receive()?  fallback()
    //     /   \
    //   yes   no
    //  /        \
    //receive()  fallback()
}

// Concepts we didn't cover yet (will cover in later sections)
// 1. Enum
// 2. Events
// 3. Try / Catch
// 4. Function Selector
// 5. abi.encode / decode
// 6. Hash with keccak256
// 7. Yul / Assembly
