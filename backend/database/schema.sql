CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  profile_image TEXT,
  date_of_birth BIGINT,
  calendar_type TEXT NOT NULL DEFAULT 'jalali',
  gender TEXT,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::bigint)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique ON users(phone) WHERE phone IS NOT NULL;

CREATE TABLE IF NOT EXISTS routines (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  recurrence_mode TEXT NOT NULL DEFAULT 'specific_weekdays',
  recurrence_weekdays SMALLINT[] NOT NULL DEFAULT ARRAY[0,1,2,3,4,5,6]::smallint[],
  recurrence_day_of_week SMALLINT,
  recurrence_day_of_month SMALLINT,
  alarm_enabled INTEGER NOT NULL DEFAULT 0,
  alarm_time TEXT,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::bigint)
);

CREATE TABLE IF NOT EXISTS routine_logs (
  id SERIAL PRIMARY KEY,
  routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  date BIGINT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('done', 'missed')),
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::bigint),
  updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::bigint),
  UNIQUE (routine_id, date)
);

CREATE TABLE IF NOT EXISTS daily_tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_date BIGINT NOT NULL,
  content TEXT NOT NULL,
  is_done INTEGER NOT NULL DEFAULT 0,
  alarm_enabled INTEGER NOT NULL DEFAULT 0,
  alarm_time TEXT,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::bigint),
  updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::bigint)
);

CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::bigint),
  updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::bigint)
);

CREATE TABLE IF NOT EXISTS important_days (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date BIGINT NOT NULL,
  event_time TEXT NOT NULL,
  icon TEXT,
  icon_color TEXT,
  created_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::bigint),
  updated_at BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::bigint)
);

CREATE INDEX IF NOT EXISTS idx_important_days_user_id ON important_days(user_id);
CREATE INDEX IF NOT EXISTS idx_important_days_event_date ON important_days(event_date);

CREATE INDEX IF NOT EXISTS idx_routines_user_id ON routines(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_routine_id ON routine_logs(routine_id);
CREATE INDEX IF NOT EXISTS idx_logs_date ON routine_logs(date);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON daily_tasks(user_id, task_date);
CREATE INDEX IF NOT EXISTS idx_notes_user_updated_at ON notes(user_id, updated_at DESC);

ALTER TABLE important_days
  ADD COLUMN IF NOT EXISTS icon TEXT,
  ADD COLUMN IF NOT EXISTS icon_color TEXT;

ALTER TABLE routines
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS icon TEXT,
  ADD COLUMN IF NOT EXISTS recurrence_mode TEXT NOT NULL DEFAULT 'specific_weekdays',
  ADD COLUMN IF NOT EXISTS recurrence_weekdays SMALLINT[] NOT NULL DEFAULT ARRAY[0,1,2,3,4,5,6]::smallint[],
  ADD COLUMN IF NOT EXISTS recurrence_day_of_week SMALLINT,
  ADD COLUMN IF NOT EXISTS recurrence_day_of_month SMALLINT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'routines_recurrence_mode_check'
  ) THEN
    ALTER TABLE routines
      ADD CONSTRAINT routines_recurrence_mode_check
      CHECK (recurrence_mode IN ('specific_weekdays', 'weekly_day', 'monthly_day'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'routines_recurrence_payload_check'
  ) THEN
    ALTER TABLE routines
      ADD CONSTRAINT routines_recurrence_payload_check
      CHECK (
        (
          recurrence_mode = 'specific_weekdays'
          AND recurrence_weekdays IS NOT NULL
          AND cardinality(recurrence_weekdays) > 0
          AND recurrence_weekdays <@ ARRAY[0,1,2,3,4,5,6]::smallint[]
          AND recurrence_day_of_week IS NULL
          AND recurrence_day_of_month IS NULL
        )
        OR (
          recurrence_mode = 'weekly_day'
          AND recurrence_weekdays = ARRAY[]::smallint[]
          AND recurrence_day_of_week BETWEEN 0 AND 6
          AND recurrence_day_of_month IS NULL
        )
        OR (
          recurrence_mode = 'monthly_day'
          AND recurrence_weekdays = ARRAY[]::smallint[]
          AND recurrence_day_of_week IS NULL
          AND recurrence_day_of_month BETWEEN 1 AND 31
        )
      );
  END IF;
END $$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS calendar_type TEXT NOT NULL DEFAULT 'jalali';
