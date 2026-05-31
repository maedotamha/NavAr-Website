const assert = require('node:assert/strict');
const { test } = require('node:test');
const createMobileSyncService = require('../src/application/services/mobileSyncService');

function createRepo(){
  const calls = [];
  let nextId = 1;

  async function save(kind, id, input){
    calls.push({ kind, id, input });
    return {
      id: nextId++,
      ...input,
      session_id: input.session_id || id || null,
      visited_node_ids: input.visited_node_ids || []
    };
  }

  return {
    calls,
    upsertSessionByClientId: (id, input) => save('upsertSessionByClientId', id, input),
    createSession: input => save('createSession', null, input)
  };
}

test('session start stores qr_id and string destination_node_id', async () => {
  const repo = createRepo();
  const service = createMobileSyncService(repo);

  const sessions = await service.startSessions({
    session_id: 'session-start-1',
    qr_id: 'Block-H-Floor-1-1',
    destination_node_id: '17',
    started_at: '2026-05-31T09:00:00.000Z'
  });

  assert.equal(repo.calls.length, 1);
  assert.equal(repo.calls[0].kind, 'upsertSessionByClientId');
  assert.equal(repo.calls[0].input.session_scope, 'inside');
  assert.equal(repo.calls[0].input.qr_id, 'Block-H-Floor-1-1');
  assert.equal(repo.calls[0].input.destination, '17');
  assert.equal(repo.calls[0].input.session_status, null);
  assert.deepEqual(repo.calls[0].input.visited_node_ids, []);
  assert.equal(sessions[0].destination_node_id, '17');
});

test('session end stores completed status and integer visited_node_ids', async () => {
  const repo = createRepo();
  const service = createMobileSyncService(repo);

  const sessions = await service.endSessions({
    session_id: 'session-end-1',
    qr_id: 'Block-H-Floor-1-1',
    destination_node_id: '17',
    visited_node_ids: [1, '2', 3],
    session_status: 'completed',
    ended_at: '2026-05-31T09:08:00.000Z'
  });

  assert.equal(repo.calls.length, 1);
  assert.equal(repo.calls[0].input.destination, '17');
  assert.equal(repo.calls[0].input.session_status, 'completed');
  assert.deepEqual(repo.calls[0].input.visited_node_ids, [1, 2, 3]);
  assert.deepEqual(sessions[0].visited_node_ids, [1, 2, 3]);
});

test('session cancel mirrors end payload but stores cancelled status and cancelled_at', async () => {
  const repo = createRepo();
  const service = createMobileSyncService(repo);

  await service.cancelSessions({
    session_id: 'session-cancel-1',
    qr_id: 'Block-H-Floor-1-1',
    destination_node_id: '17',
    visited_node_ids: [4, '5', 6],
    session_status: 'cancelled',
    cancelled_at: '2026-05-31T09:04:00.000Z'
  });

  assert.equal(repo.calls.length, 1);
  assert.equal(repo.calls[0].input.destination, '17');
  assert.equal(repo.calls[0].input.session_status, 'cancelled');
  assert.deepEqual(repo.calls[0].input.visited_node_ids, [4, 5, 6]);
  assert.equal(repo.calls[0].input.client_created_at, '2026-05-31T09:04:00.000Z');
});

test('invalid visited_node_ids fail before saving', async () => {
  const repo = createRepo();
  const service = createMobileSyncService(repo);

  await assert.rejects(
    () => service.endSessions({
      session_id: 'bad-visited-node',
      qr_id: 'Block-H-Floor-1-1',
      destination_node_id: '17',
      visited_node_ids: [1, 'not-an-integer']
    }),
    /visited_node_ids must be a valid integer/
  );

  assert.equal(repo.calls.length, 0);
});
