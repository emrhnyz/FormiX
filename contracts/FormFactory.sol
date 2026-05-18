// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {EncryptedForm} from "./EncryptedForm.sol";

/// @title FormFactory
/// @notice Deploys EncryptedForm instances for creators.
contract FormFactory {
    address[] public forms;
    mapping(address => address[]) public formsByCreator;

    event FormCreated(
        address indexed form,
        address indexed creator,
        bytes32 schemaHash,
        uint8 kind,
        bool showLiveResults,
        bool rewardEnabled,
        uint256 rewardPerSubmission,
        uint256 maxRewardRecipients,
        uint8 fheQuestionCount
    );

    function formCount() external view returns (uint256) {
        return forms.length;
    }

    function getCreatorForms(address creator) external view returns (address[] memory) {
        return formsByCreator[creator];
    }

    function createForm(
        EncryptedForm.FormSettings calldata settings,
        uint8[] calldata slotCountsPerQuestion,
        uint8[] calldata questionKinds
    ) external payable returns (address formAddress) {
        EncryptedForm form = new EncryptedForm{value: msg.value}(
            msg.sender,
            settings,
            slotCountsPerQuestion,
            questionKinds
        );
        formAddress = address(form);
        forms.push(formAddress);
        formsByCreator[msg.sender].push(formAddress);

        emit FormCreated(
            formAddress,
            msg.sender,
            settings.schemaHash,
            uint8(settings.kind),
            settings.showLiveResults,
            settings.rewardEnabled,
            settings.rewardPerSubmission,
            settings.maxRewardRecipients,
            settings.fheQuestionCount
        );
    }

    function getForm(uint256 index) external view returns (address) {
        require(index < forms.length, "Index OOB");
        return forms[index];
    }
}
