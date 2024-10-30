// SPDX-License-Identifier: MIT

pragma solidity 0.8.25;

import {
    MessageHashUtils
} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import { DeltaNeutralTokenV1 } from "./DeltaNeutralTokenV1.sol";

contract DeltaNeutralTokenV1Tron is DeltaNeutralTokenV1 {
    bytes32 private constant TYPE_HASH =
        keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );

    /**
     * @dev Hashes typed data according to TIP712
     */
    function _hashTypedDataV4(
        bytes32 structHash
    ) internal view override returns (bytes32) {
        return
            MessageHashUtils.toTypedDataHash(domainSeparatorV4(), structHash);
    }

    /**
     * @dev Gets chain id in Tron format
     */
    function getChainId() internal view returns (uint256) {
        return block.chainid & 0xffffffff;
    }

    /**
     * @dev Returns the domain separator for the current chain.
     */
    function domainSeparatorV4() internal view returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    TYPE_HASH,
                    _EIP712NameHash(),
                    _EIP712VersionHash(),
                    getChainId(),
                    address(this)
                )
            );
    }
}
