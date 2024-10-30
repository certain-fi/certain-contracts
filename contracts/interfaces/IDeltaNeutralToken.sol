// SPDX-License-Identifier: MIT

pragma solidity 0.8.25;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IDeltaNeutralToken is IERC20 {
    // ERRORS

    error LengthMismatch();

    error SenderBlacklisted();

    error ReceiverBlacklisted();

    // EVENTS

    /**
     * @notice Event emitted on blacklist update
     * @param account Address that's blacklist status was updated
     * @param blacklisted True if added to blacklist, false if removed
     */
    event BlacklistedUpdated(address indexed account, bool blacklisted);

    /**
     * @notice Event emitted on destruction of black funds
     * @param account Address of blacklisted account
     * @param balance Amount of funds destroyed
     */
    event BlacklistedFundsDestroyed(address account, uint256 balance);

    // FUNCTIONS

    /**
     * @notice Gets if address is blacklisted
     * @param account Address to check
     * @return True if blacklisted, false otherwise
     */
    function isBlacklisted(address account) external view returns (bool);

    /**
     * @notice Initializes contract
     * @param name_ ERC20 token name
     * @param symbol_ ERC20 token symbol
     * @param initialOwner Owner of the contract
     */
    function initialize(
        string calldata name_,
        string calldata symbol_,
        address initialOwner
    ) external;

    /**
     * @notice Mints tokens to address
     * @param to Address of the receiver
     * @param amount Amount to mint (wei)
     */
    function mint(address to, uint256 amount) external;

    /**
     * @notice Mints tokens to a batch of addresses
     * @param receivers Addresses of the receivers
     * @param amounts Amounts to mint to respective accounts (wei)
     */
    function batchMint(
        address[] calldata receivers,
        uint256[] calldata amounts
    ) external;

    /**
     * @notice Burns tokens from owner's address
     * @param amount Amount to burn (wei)
     */
    function burn(uint256 amount) external;

    /**
     * @notice Sets blacklist status for an account
     * @param account Address to update
     * @param blacklisted True to add to blacklist, false to remove from blacklist
     */
    function setBlacklisted(address account, bool blacklisted) external;

    /**
     * @notice Burns all tokens from given blacklisted address
     * @param account Address to destroy tokens
     */
    function destroyBlackFunds(address account) external;

    /**
     * @notice Transfers tokens to a batch of addresses
     * @param receivers Addresses of the receivers
     * @param amounts Amounts to transfer to respective addresses
     */
    function batchTransfer(
        address[] calldata receivers,
        uint256[] calldata amounts
    ) external;

    /**
     * @notice Transfers tokens from batch of addresses
     * @param senders Addresses of the senders
     * @param receivers Addresses of the receivers
     * @param amounts Amounts to transfer from and to respective addresses
     */
    function batchTransferFrom(
        address[] calldata senders,
        address[] calldata receivers,
        uint256[] calldata amounts
    ) external;

    /**
     * @notice Approves tokens spend for a batch of addresses
     * @param spenders Addresses of spenders
     * @param amounts Amounts to approve for respective addresses
     */
    function batchApprove(
        address[] calldata spenders,
        uint256[] calldata amounts
    ) external;
}
