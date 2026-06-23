const approvedCompanionRequests = new Set<string>();
let parentNotificationsRead = false;
let companionNotificationsRead = false;
let companionRequestNotification = {
    companionName: '',
    childName: '',
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

export const hasUnreadParentNotifications = () => false;

export const markParentNotificationsRead = () => {
    parentNotificationsRead = true;
};

export const hasUnreadCompanionNotifications = () => false;

export const markCompanionNotificationsRead = () => {
    companionNotificationsRead = true;
};
