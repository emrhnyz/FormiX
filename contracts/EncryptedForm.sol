// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {FHE, euint32, ebool, InEuint32} from "@fhenixprotocol/cofhe-contracts/FHE.sol";

/// @title EncryptedForm
/// @notice All answers stored as FHE — choice tallies or per-respondent text chunks.
contract EncryptedForm {
    uint8 public constant MAX_OPTIONS = 8;
    uint8 public constant MAX_FHE_QUESTIONS = 10;
    uint8 public constant MAX_TEXT_CHUNKS = 24;

    uint8 public constant KIND_CHOICE = 0;
    uint8 public constant KIND_MULTI = 1;
    uint8 public constant KIND_TEXT = 2;

    enum FormKind {
        Form,
        Poll
    }

    struct FormSettings {
        string title;
        string description;
        FormKind kind;
        bool showLiveResults;
        bool rewardEnabled;
        uint256 rewardPerSubmission;
        uint256 maxRewardRecipients;
        bytes32 schemaHash;
        uint8 fheQuestionCount;
    }

    address public immutable creator;
    FormSettings public settings;
    uint256 public totalSubmissions;
    uint256 public rewardsPaidCount;

    uint8[MAX_FHE_QUESTIONS] public questionKinds;
    uint8[MAX_FHE_QUESTIONS] public slotCounts;
    euint32 private encryptedZero;
    euint32 private encryptedOne;
    euint32[MAX_FHE_QUESTIONS][MAX_OPTIONS] private tallies;
    mapping(address => mapping(uint8 => mapping(uint8 => euint32))) private textAnswers;

    address[] public respondents;
    mapping(address => bool) public hasSubmitted;
    mapping(address => bool) public fheAnswersRecorded;
    mapping(address => uint256) private fheAnsweredMask;

    event ResponseSubmitted(address indexed respondent, uint256 rewardPaid);
    event BountyDeposited(address indexed from, uint256 amount);

    modifier onlyCreator() {
        require(msg.sender == creator, "Not creator");
        _;
    }

    constructor(
        address _creator,
        FormSettings memory _settings,
        uint8[] memory _slotCounts,
        uint8[] memory _questionKinds
    ) payable {
        require(_creator != address(0), "Invalid creator");
        require(_settings.fheQuestionCount <= MAX_FHE_QUESTIONS, "Too many FHE questions");
        require(_slotCounts.length == _settings.fheQuestionCount, "Slot mismatch");
        require(_questionKinds.length == _settings.fheQuestionCount, "Kind mismatch");

        creator = _creator;
        settings = FormSettings({
            title: _settings.title,
            description: "",
            kind: _settings.kind,
            showLiveResults: _settings.showLiveResults,
            rewardEnabled: _settings.rewardEnabled,
            rewardPerSubmission: _settings.rewardPerSubmission,
            maxRewardRecipients: _settings.maxRewardRecipients,
            schemaHash: _settings.schemaHash,
            fheQuestionCount: _settings.fheQuestionCount
        });

        if (_settings.fheQuestionCount > 0) {
            encryptedZero = FHE.asEuint32(0);
            encryptedOne = FHE.asEuint32(1);
            FHE.allowThis(encryptedZero);
            FHE.allowThis(encryptedOne);

            for (uint8 q = 0; q < _settings.fheQuestionCount; ) {
                uint8 kind = _questionKinds[q];
                uint8 slots = _slotCounts[q];
                questionKinds[q] = kind;
                slotCounts[q] = slots;

                if (kind == KIND_TEXT) {
                    require(slots > 0 && slots <= MAX_TEXT_CHUNKS, "Invalid text slots");
                } else {
                    require(slots > 1 && slots <= MAX_OPTIONS, "Invalid options");
                    for (uint8 o = 0; o < slots; ) {
                        tallies[q][o] = encryptedZero;
                        FHE.allowThis(tallies[q][o]);
                        unchecked {
                            ++o;
                        }
                    }
                }
                unchecked {
                    ++q;
                }
            }
        }

        if (msg.value > 0) {
            emit BountyDeposited(msg.sender, msg.value);
        }
    }

    function depositBounty() external payable {
        require(msg.value > 0, "No value");
        emit BountyDeposited(msg.sender, msg.value);
    }

    function submitFheQuestion(uint8 questionIndex, InEuint32[] calldata values) external {
        _submitFheQuestion(questionIndex, values);
    }

    function submitFheAnswer(uint8 questionIndex, InEuint32 calldata encryptedChoice) external {
        require(!hasSubmitted[msg.sender], "Already submitted");
        require(questionIndex < settings.fheQuestionCount, "Bad question");
        uint256 bit = uint256(1) << questionIndex;
        require(fheAnsweredMask[msg.sender] & bit == 0, "Question already answered");
        require(questionKinds[questionIndex] == KIND_CHOICE, "Use submitFheQuestion");
        _recordFheChoice(questionIndex, encryptedChoice);
        fheAnsweredMask[msg.sender] |= bit;
        if (_allFheQuestionsAnswered(msg.sender)) {
            fheAnswersRecorded[msg.sender] = true;
        }
    }

    function _submitFheQuestion(uint8 questionIndex, InEuint32[] calldata values) private {
        require(!hasSubmitted[msg.sender], "Already submitted");
        require(questionIndex < settings.fheQuestionCount, "Bad question");
        uint256 bit = uint256(1) << questionIndex;
        require(fheAnsweredMask[msg.sender] & bit == 0, "Question already answered");

        uint8 kind = questionKinds[questionIndex];
        if (kind == KIND_CHOICE) {
            require(values.length == 1, "Choice length");
            _recordFheChoice(questionIndex, values[0]);
        } else if (kind == KIND_MULTI) {
            _recordFheMulti(questionIndex, values);
        } else {
            _recordFheText(questionIndex, values);
        }

        fheAnsweredMask[msg.sender] |= bit;
        if (_allFheQuestionsAnswered(msg.sender)) {
            fheAnswersRecorded[msg.sender] = true;
        }
    }

    function submitFheAnswers(InEuint32[] calldata encryptedChoices) external {
        require(!hasSubmitted[msg.sender], "Already submitted");
        require(encryptedChoices.length == settings.fheQuestionCount, "Answer count mismatch");
        require(questionKinds[0] == KIND_CHOICE, "Use submitFheQuestion");

        for (uint8 q = 0; q < settings.fheQuestionCount; ) {
            require(questionKinds[q] == KIND_CHOICE, "Use submitFheQuestion");
            _recordFheChoice(q, encryptedChoices[q]);
            unchecked {
                ++q;
            }
        }

        fheAnswersRecorded[msg.sender] = true;
        fheAnsweredMask[msg.sender] = (uint256(1) << settings.fheQuestionCount) - 1;
    }

    function _recordFheChoice(uint8 q, InEuint32 calldata encryptedChoice) private {
        uint8 opts = slotCounts[q];
        euint32 choice = FHE.asEuint32(encryptedChoice);

        for (uint8 i = 0; i < opts; ) {
            ebool isSelected = FHE.eq(choice, FHE.asEuint32(i));
            euint32 increment = FHE.select(isSelected, encryptedOne, encryptedZero);
            tallies[q][i] = FHE.add(tallies[q][i], increment);
            FHE.allowThis(tallies[q][i]);
            unchecked {
                ++i;
            }
        }
    }

    function _recordFheMulti(uint8 q, InEuint32[] calldata values) private {
        uint8 opts = slotCounts[q];
        require(values.length == opts, "Multi length");

        for (uint8 i = 0; i < opts; ) {
            euint32 bit = FHE.asEuint32(values[i]);
            ebool isOne = FHE.eq(bit, encryptedOne);
            euint32 increment = FHE.select(isOne, encryptedOne, encryptedZero);
            tallies[q][i] = FHE.add(tallies[q][i], increment);
            FHE.allowThis(tallies[q][i]);
            unchecked {
                ++i;
            }
        }
    }

    function _recordFheText(uint8 q, InEuint32[] calldata values) private {
        uint8 n = slotCounts[q];
        require(values.length == n, "Text length");

        for (uint8 i = 0; i < n; ) {
            euint32 v = FHE.asEuint32(values[i]);
            textAnswers[msg.sender][q][i] = v;
            FHE.allowThis(v);
            FHE.allow(v, creator);
            unchecked {
                ++i;
            }
        }
    }

    function _allFheQuestionsAnswered(address user) private view returns (bool) {
        uint8 n = settings.fheQuestionCount;
        if (n == 0) return true;
        uint256 expected = (uint256(1) << n) - 1;
        return fheAnsweredMask[user] == expected;
    }

    /// @notice Hangi FHE sorularının yanıtlandığını bit maskesi olarak döner (bit q = soru q).
    function fheAnswerProgress(address user) external view returns (uint256) {
        return fheAnsweredMask[user];
    }

    function finalizeSubmission() external {
        require(!hasSubmitted[msg.sender], "Already submitted");
        if (settings.fheQuestionCount > 0) {
            require(fheAnswersRecorded[msg.sender], "Submit FHE answers first");
        }
        hasSubmitted[msg.sender] = true;
        respondents.push(msg.sender);
        unchecked {
            totalSubmissions++;
        }
        uint256 payout = _payoutReward();
        emit ResponseSubmitted(msg.sender, payout);
    }

    function respondentCount() external view returns (uint256) {
        return respondents.length;
    }

    function getRespondent(uint256 index) external view returns (address) {
        require(index < respondents.length, "Index OOB");
        return respondents[index];
    }

    function _payoutReward() private returns (uint256 payout) {
        if (
            !settings.rewardEnabled || settings.rewardPerSubmission == 0
                || rewardsPaidCount >= settings.maxRewardRecipients
        ) {
            return 0;
        }
        payout = settings.rewardPerSubmission;
        if (address(this).balance >= payout) {
            (bool sent,) = payable(msg.sender).call{value: payout}("");
            if (sent) {
                unchecked {
                    rewardsPaidCount++;
                }
            } else {
                payout = 0;
            }
        } else {
            payout = 0;
        }
    }

    function getEncryptedTally(uint8 questionIndex, uint8 optionIndex) external view returns (euint32) {
        require(questionIndex < settings.fheQuestionCount, "Bad question");
        require(questionKinds[questionIndex] != KIND_TEXT, "Not tally");
        require(optionIndex < slotCounts[questionIndex], "Bad option");
        return tallies[questionIndex][optionIndex];
    }

    function getEncryptedTextChunk(
        address respondent,
        uint8 questionIndex,
        uint8 chunkIndex
    ) external view returns (euint32) {
        require(questionIndex < settings.fheQuestionCount, "Bad question");
        require(questionKinds[questionIndex] == KIND_TEXT, "Not text");
        require(chunkIndex < slotCounts[questionIndex], "Bad chunk");
        return textAnswers[respondent][questionIndex][chunkIndex];
    }

    function allowCreatorToViewTallies() external onlyCreator {
        for (uint8 q = 0; q < settings.fheQuestionCount; ) {
            if (questionKinds[q] == KIND_TEXT) {
                unchecked {
                    ++q;
                }
                continue;
            }
            uint8 opts = slotCounts[q];
            for (uint8 i = 0; i < opts; ) {
                FHE.allow(tallies[q][i], creator);
                unchecked {
                    ++i;
                }
            }
            unchecked {
                ++q;
            }
        }
    }

    function allowTallyPublic(uint8 questionIndex, uint8 optionIndex) external onlyCreator {
        require(questionIndex < settings.fheQuestionCount, "Bad question");
        require(questionKinds[questionIndex] != KIND_TEXT, "Not tally");
        require(optionIndex < slotCounts[questionIndex], "Bad option");
        FHE.allowPublic(tallies[questionIndex][optionIndex]);
    }

    function publishTallyResult(
        uint8 questionIndex,
        uint8 optionIndex,
        uint32 plaintext,
        bytes calldata signature
    ) external onlyCreator {
        require(questionIndex < settings.fheQuestionCount, "Bad question");
        require(questionKinds[questionIndex] != KIND_TEXT, "Not tally");
        require(optionIndex < slotCounts[questionIndex], "Bad option");
        FHE.publishDecryptResult(tallies[questionIndex][optionIndex], plaintext, signature);
    }

    function getPublishedTally(uint8 questionIndex, uint8 optionIndex) external view returns (uint256) {
        require(questionIndex < settings.fheQuestionCount, "Bad question");
        require(questionKinds[questionIndex] != KIND_TEXT, "Not tally");
        require(optionIndex < slotCounts[questionIndex], "Bad option");
        (uint256 value, bool decrypted) = FHE.getDecryptResultSafe(tallies[questionIndex][optionIndex]);
        if (!decrypted) revert("Not published");
        return value;
    }

    function getBountyBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
