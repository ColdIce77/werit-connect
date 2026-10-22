import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { BlockReason } from '../../features/auth/authStore';

/** Start */
export type HomeStackParamList = {
  Dashboard: undefined;
  NewsList: undefined;
  NewsDetail: { postId: string };
  Tasks: undefined;
  Notifications: undefined;
};

/** Verzeichnis. Auf Tablets zeigt die Liste das Detail daneben (selectedUserId). */
export type DirectoryStackParamList = {
  DirectoryList: { selectedUserId?: string } | undefined;
  EmployeeDetail: { userId: string };
};

/** KI-Assistent */
export type AssistantStackParamList = {
  AssistantChat: { conversationId?: string } | undefined;
  AssistantHistory: undefined;
};

/** Dokumente. Auf Tablets zeigt die Liste das Detail daneben (selectedDocumentId). */
export type DocumentsStackParamList = {
  DocumentList: { selectedDocumentId?: string } | undefined;
  RecentDocuments: undefined;
  DocumentViewer: { documentId: string };
};

/** Mehr */
export type MoreStackParamList = {
  MoreMenu: undefined;
  SafetyList: undefined;
  SafetyDetail: { instructionId: string };
  TicketList: undefined;
  TicketDetail: { ticketId: string };
  ApprovalList: undefined;
  ApprovalDetail: { approvalId: string };
  Settings: undefined;
  LanguageSettings: undefined;
  NotificationSettings: undefined;
  About: undefined;
  AdminHome: undefined;
  PublishPost: undefined;
  PublishSecurityAlert: undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  DirectoryTab: NavigatorScreenParams<DirectoryStackParamList>;
  AssistantTab: NavigatorScreenParams<AssistantStackParamList>;
  DocumentsTab: NavigatorScreenParams<DocumentsStackParamList>;
  MoreTab: NavigatorScreenParams<MoreStackParamList>;
};

export type RootStackParamList = {
  Login: undefined;
  DeviceBlocked: { reason: BlockReason };
  Main: NavigatorScreenParams<MainTabParamList>;
  Emergency: undefined;
  TicketCreate: undefined;
  SecurityAlert: { notificationId: string };
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type HomeScreenProps<T extends keyof HomeStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<HomeStackParamList, T>,
  BottomTabScreenProps<MainTabParamList>
>;

export type DirectoryScreenProps<T extends keyof DirectoryStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<DirectoryStackParamList, T>,
  BottomTabScreenProps<MainTabParamList>
>;

export type AssistantScreenProps<T extends keyof AssistantStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<AssistantStackParamList, T>,
  BottomTabScreenProps<MainTabParamList>
>;

export type DocumentsScreenProps<T extends keyof DocumentsStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<DocumentsStackParamList, T>,
  BottomTabScreenProps<MainTabParamList>
>;

export type MoreScreenProps<T extends keyof MoreStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<MoreStackParamList, T>,
  BottomTabScreenProps<MainTabParamList>
>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
