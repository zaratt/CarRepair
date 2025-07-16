export type MaintenanceAttachmentType = 'photo' | 'pdf';

export interface MaintenanceAttachment {
    id: string;
    maintenanceId: string;
    type: MaintenanceAttachmentType;
    url: string;
    name: string;
    createdAt: string;
}
