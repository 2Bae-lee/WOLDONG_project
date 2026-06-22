const approvedCompanionRequests = new Set<string>();

export const approveCompanionRequestNotification = (name: string) => {
    approvedCompanionRequests.add(name);
};

export const isCompanionRequestNotificationApproved = (name: string) => (
    approvedCompanionRequests.has(name)
);
