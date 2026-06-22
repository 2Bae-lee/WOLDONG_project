const approvedCompanionRequests = new Set<string>();
let parentNotificationsRead = false;
let companionNotificationsRead = false;
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
    parentNotificationsRead = false;
};

export const getCompanionRequestNotification = () => companionRequestNotification;

export const approveCompanionRequestNotification = (name: string) => {
    approvedCompanionRequests.add(name);
};

export const isCompanionRequestNotificationApproved = (name: string) => (
    approvedCompanionRequests.has(name)
);

export const hasUnreadParentNotifications = () => !parentNotificationsRead;

export const markParentNotificationsRead = () => {
    parentNotificationsRead = true;
};

export const hasUnreadCompanionNotifications = () => !companionNotificationsRead;

export const markCompanionNotificationsRead = () => {
    companionNotificationsRead = true;
};
