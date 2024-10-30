// SPDX-License-Identifier: MIT

pragma solidity 0.8.25;

import {
    ERC20PermitUpgradeable
} from "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import {
    Ownable2StepUpgradeable
} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import { IDeltaNeutralToken } from "./interfaces/IDeltaNeutralToken.sol";

contract DeltaNeutralTokenV1 is
    ERC20PermitUpgradeable,
    Ownable2StepUpgradeable,
    IDeltaNeutralToken
{
    // STORAGE

    /// @notice Mapping of addresses to their blacklist status
    mapping(address => bool) internal _blacklisted;

    // CONSTRUCTOR & INITIALIZER

    constructor() {
        _disableInitializers();
    }

    function initialize(
        string calldata name_,
        string calldata symbol_,
        address initialOwner
    ) external initializer {
        __Ownable_init(initialOwner);
        __ERC20_init(name_, symbol_);
        __ERC20Permit_init(name_);
    }

    // PUBLIC VIEW FUNCTIONS

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function isBlacklisted(address account) external view returns (bool) {
        return _blacklisted[account];
    }

    // PUBLIC RESTRICTED FUNCTIONS

    /**
     * @inheritdoc IDeltaNeutralToken
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @inheritdoc IDeltaNeutralToken
     */
    function batchMint(
        address[] calldata receivers,
        uint256[] calldata amounts
    ) external onlyOwner {
        if (receivers.length != amounts.length) {
            revert LengthMismatch();
        }

        for (uint256 i = 0; i < receivers.length; i++) {
            _mint(receivers[i], amounts[i]);
        }
    }

    /**
     * @inheritdoc IDeltaNeutralToken
     */
    function burn(uint256 amount) external onlyOwner {
        _burn(_msgSender(), amount);
    }

    /**
     * @inheritdoc IDeltaNeutralToken
     */
    function setBlacklisted(
        address account,
        bool blacklisted
    ) external onlyOwner {
        _blacklisted[account] = blacklisted;

        emit BlacklistedUpdated(account, blacklisted);
    }

    /**
     * @inheritdoc IDeltaNeutralToken
     */
    function destroyBlackFunds(address account) external onlyOwner {
        require(this.isBlacklisted(account), "Account is not blacklisted");
        uint256 dirtyFunds = balanceOf(account);

        // Temporary un-blacklist to allow _update()
        _blacklisted[account] = false;
        _burn(account, dirtyFunds);
        _blacklisted[account] = true;

        emit BlacklistedFundsDestroyed(account, dirtyFunds);
    }

    // PUBLIC USER FUNCTIONS

    /**
     * @inheritdoc IDeltaNeutralToken
     */
    function batchTransfer(
        address[] calldata receivers,
        uint256[] calldata amounts
    ) external {
        if (receivers.length != amounts.length) {
            revert LengthMismatch();
        }

        address owner = _msgSender();
        for (uint256 i = 0; i < receivers.length; i++) {
            _transfer(owner, receivers[i], amounts[i]);
        }
    }

    /**
     * @inheritdoc IDeltaNeutralToken
     */
    function batchTransferFrom(
        address[] calldata senders,
        address[] calldata receivers,
        uint256[] calldata amounts
    ) external {
        if (
            senders.length != receivers.length ||
            senders.length != amounts.length
        ) {
            revert LengthMismatch();
        }

        address spender = _msgSender();
        for (uint256 i = 0; i < senders.length; i++) {
            _spendAllowance(senders[i], spender, amounts[i]);
            _transfer(senders[i], receivers[i], amounts[i]);
        }
    }

    /**
     * @inheritdoc IDeltaNeutralToken
     */
    function batchApprove(
        address[] calldata spenders,
        uint256[] calldata amounts
    ) external {
        if (spenders.length != amounts.length) {
            revert LengthMismatch();
        }

        address owner = _msgSender();
        for (uint256 i = 0; i < spenders.length; i++) {
            _approve(owner, spenders[i], amounts[i]);
        }
    }

    // INTERNAL FUNCTIONS

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override {
        if (_blacklisted[from]) {
            revert SenderBlacklisted();
        }
        if (_blacklisted[to]) {
            revert ReceiverBlacklisted();
        }

        super._update(from, to, value);
    }
}
