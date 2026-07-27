-- Ensure only one 'running' trip exists per workspace
CREATE UNIQUE INDEX one_running_trip_per_workspace ON trips (workspace_id) WHERE status = 'running';
