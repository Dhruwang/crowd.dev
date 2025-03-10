export enum SearchSyncWorkerQueueMessageType {
  SYNC_MEMBER = 'sync_member',
  SYNC_TENANT_MEMBERS = 'sync_tenant_members',
  REMOVE_MEMBER = 'remove_member',
  CLEANUP_TENANT_MEMBERS = 'cleanup_tenant_members',
  SYNC_ACTIVITY = 'sync_activity',
  SYNC_TENANT_ACTIVITIES = 'sync_tenant_activities',
  REMOVE_ACTIVITY = 'remove_activity',
  CLEANUP_TENANT_ACTIVITIES = 'cleanup_tenant_activities',
}
