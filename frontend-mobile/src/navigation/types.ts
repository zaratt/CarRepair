import { Inspection, Maintenance, User, Vehicle, Workshop } from '../types';

export type RootStackParamList = {
    Login: undefined;
    Home: undefined;
    VehicleList: undefined;
    VehicleForm: { vehicle?: Vehicle };
    VehicleDetail: { vehicleId: string };
    UserList: undefined;
    UserForm: { user?: User };
    WorkshopList: undefined;
    WorkshopForm: { workshop?: Workshop };
    WorkshopDetail: { workshopId: string };
    MaintenanceList: undefined;
    MaintenanceForm: { maintenance?: Maintenance };
    MaintenanceDetail: { maintenanceId: string };
    InspectionList: undefined;
    InspectionForm: { inspection?: Inspection };
    InspectionDetail: { inspectionId: string };
    AvailableWorkshopsScreen: undefined;
    WorkshopPendingMaintenances: undefined;
};