function createDatabaseSyncService(repo) {
  return {
    async syncRecords(records, operation) {
      const summary = await repo.mergeSourceRecords(records);
      await repo.createSyncLog(records[0]?.source || 'unknown', operation, null, null, 'summary', summary);
      return summary;
    },
    log: (source, operation, recordType, dedupeKey, action, details) =>
      repo.createSyncLog(source, operation, recordType, dedupeKey, action, details)
  };
}

module.exports = createDatabaseSyncService;
