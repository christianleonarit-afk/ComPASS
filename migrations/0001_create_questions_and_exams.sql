CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS questions (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  options jsonb NOT NULL,
  correct_answer integer NOT NULL,
  subject text NOT NULL,
  "set" integer
);

CREATE TABLE IF NOT EXISTS exams (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  question_ids jsonb NOT NULL,
  duration_minutes integer,
  created_at timestamp with time zone DEFAULT now()
);
