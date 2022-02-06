const getFaction = (tokenId) => {
    if (tokenId == 0)
        return "Cyber Ninjas";
    else if (tokenId == 1)
        return "Crypto Samurais"
    else if (tokenId == 2)
        return "Meta Shoguns"
    else
        throw "Unknown TokenId"
}
const getStatusName = (statusId) => {
    if (statusId == 0) {
        return "Pending";
    }
    else if (statusId == 1) {
        return "Active";
    }
    else if (statusId == 2) {
        return "Canceled";
    }
    else if (statusId == 3) {
        return "Defeated";
    }
    else if (statusId == 4) {
        return "Succeeded";
    }
    else if (statusId == 5) {
        return "Queued";
    }
    else if (statusId == 6) {
        return "Expired";
    }
    else if (statusId == 7) {
        return "Executed";
    }
    else {
        throw "Unknown status Id"
    }
}

export { getFaction, getStatusName};