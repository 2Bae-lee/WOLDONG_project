const approvedCompanionRequests = new Set<string>();
let companionRequestNotification = {
    companionName: '박민지',
    childName: '김월동',
};

export const registerCompanionRequestNotification = (
    companionName: string,
    childName: string
) => {
    companionRequestNotification = { companionName, childName };
    approvedCompanionRequests.delete(companionName);
};

export const getCompanionRequestNotification = () => companionRequestNotification;

export const approveCompanionRequestNotification = (name: string) => {
    approvedCompanionRequests.add(name);
};

export const isCompanionRequestNotificationApproved = (name: string) => (
    approvedCompanionRequests.has(name)
);
