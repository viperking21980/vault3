// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FileStorage
 * @notice Smart contract for storing encrypted file metadata in a decentralized way.
 * @dev Files themselves are stored in IPFS; only metadata (CID, name, etc.) is on-chain.
 *      Owner is identified by msg.sender, ensuring access control via cryptographic signatures.
 */
contract FileStorage {
    /**
     * @notice File metadata structure.
     * @param cid IPFS Content Identifier — points to the encrypted file in IPFS.
     * @param name Original file name (e.g. "photo.jpg").
     * @param size File size in bytes.
     * @param fileType MIME type or extension (e.g. "image/jpeg").
     * @param uploadedAt Block timestamp of upload (UNIX seconds).
     */
    struct File {
        string cid;
        string name;
        uint256 size;
        string fileType;
        uint256 uploadedAt;
    }

    /// @notice Maps an owner's address to the list of their files.
    mapping(address => File[]) private ownerToFiles;

    /// @notice Maps an owner + CID to existence flag (for O(1) duplicate checks).
    mapping(address => mapping(string => bool)) private ownerHasFile;

    // ─── Events ─────────────────────────────────────────────────────────────

    /// @notice Emitted when a file is added to the storage.
    event FileAdded(
        address indexed owner,
        string cid,
        string name,
        uint256 size,
        uint256 timestamp
    );

    /// @notice Emitted when a file is removed from the storage.
    event FileDeleted(address indexed owner, string cid, uint256 timestamp);

    // ─── Errors ─────────────────────────────────────────────────────────────

    error EmptyCID();
    error EmptyName();
    error FileAlreadyExists();
    error FileNotFound();

    // ─── Public functions ───────────────────────────────────────────────────

    /**
     * @notice Adds a new file record for the caller.
     * @param cid IPFS CID of the (encrypted) file.
     * @param name File name.
     * @param size File size in bytes.
     * @param fileType File type / MIME.
     */
    function addFile(
        string calldata cid,
        string calldata name,
        uint256 size,
        string calldata fileType
    ) external {
        if (bytes(cid).length == 0) revert EmptyCID();
        if (bytes(name).length == 0) revert EmptyName();
        if (ownerHasFile[msg.sender][cid]) revert FileAlreadyExists();

        ownerToFiles[msg.sender].push(
            File({
                cid: cid,
                name: name,
                size: size,
                fileType: fileType,
                uploadedAt: block.timestamp
            })
        );
        ownerHasFile[msg.sender][cid] = true;

        emit FileAdded(msg.sender, cid, name, size, block.timestamp);
    }

    /**
     * @notice Deletes a file record by its CID.
     * @dev Uses swap-and-pop for O(1) removal from the dynamic array.
     *      The encrypted blob in IPFS is NOT touched — only its on-chain metadata.
     * @param cid IPFS CID of the file to remove.
     */
    function deleteFile(string calldata cid) external {
        if (!ownerHasFile[msg.sender][cid]) revert FileNotFound();

        File[] storage files = ownerToFiles[msg.sender];
        uint256 length = files.length;

        for (uint256 i = 0; i < length; i++) {
            if (keccak256(bytes(files[i].cid)) == keccak256(bytes(cid))) {
                files[i] = files[length - 1];
                files.pop();
                ownerHasFile[msg.sender][cid] = false;
                emit FileDeleted(msg.sender, cid, block.timestamp);
                return;
            }
        }
    }

    /**
     * @notice Returns all files of a specific user.
     * @param user Address whose files are queried.
     * @return Array of File structs.
     */
    function getFiles(address user) external view returns (File[] memory) {
        return ownerToFiles[user];
    }

    /**
     * @notice Returns the number of files belonging to a user.
     * @param user Address to query.
     * @return Number of files.
     */
    function getFileCount(address user) external view returns (uint256) {
        return ownerToFiles[user].length;
    }

    /**
     * @notice Checks if a user owns a file with the given CID.
     * @param user Address to query.
     * @param cid IPFS CID to check.
     * @return True if the user has a file with this CID.
     */
    function hasFile(
        address user,
        string calldata cid
    ) external view returns (bool) {
        return ownerHasFile[user][cid];
    }
}