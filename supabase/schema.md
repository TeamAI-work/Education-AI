| table_name     | column_name      | data_type                | udt_name         | is_nullable | column_default    | constraint_type | references_table | references_column |
| -------------- | ---------------- | ------------------------ | ---------------- | ----------- | ----------------- | --------------- | ---------------- | ----------------- |
| activity_logs  | id               | uuid                     | uuid             | NO          | gen_random_uuid() | PRIMARY KEY     | activity_logs    | id                |
| activity_logs  | user_id          | uuid                     | uuid             | YES         | null              | FOREIGN KEY     | profiles         | id                |
| activity_logs  | activity_type    | text                     | text             | NO          | null              | null            | null             | null              |
| activity_logs  | score            | integer                  | int4             | YES         | null              | null            | null             | null              |
| activity_logs  | completed_at     | timestamp with time zone | timestamptz      | YES         | now()             | null            | null             | null              |
| activity_logs  | metadata         | jsonb                    | jsonb            | YES         | '{}'::jsonb       | null            | null             | null              |
| badges         | id               | uuid                     | uuid             | NO          | gen_random_uuid() | PRIMARY KEY     | badges           | id                |
| badges         | title            | text                     | text             | NO          | null              | null            | null             | null              |
| badges         | description      | text                     | text             | YES         | null              | null            | null             | null              |
| badges         | icon_url         | text                     | text             | YES         | null              | null            | null             | null              |
| badges         | grade_group      | USER-DEFINED             | grade_group_type | YES         | null              | null            | null             | null              |
| badges         | created_at       | timestamp with time zone | timestamptz      | YES         | now()             | null            | null             | null              |
| badges         | rarity           | text                     | text             | NO          | 'common'::text    | null            | null             | null              |
| badges         | identifier       | integer                  | int4             | NO          | null              | UNIQUE          | badges           | identifier        |
| chat_messages  | id               | uuid                     | uuid             | NO          | gen_random_uuid() | PRIMARY KEY     | chat_messages    | id                |
| chat_messages  | session_id       | uuid                     | uuid             | YES         | null              | FOREIGN KEY     | chat_sessions    | id                |
| chat_messages  | sender           | USER-DEFINED             | chat_sender_type | NO          | null              | null            | null             | null              |
| chat_messages  | message_content  | text                     | text             | NO          | null              | null            | null             | null              |
| chat_messages  | citations        | jsonb                    | jsonb            | YES         | '[]'::jsonb       | null            | null             | null              |
| chat_messages  | created_at       | timestamp with time zone | timestamptz      | YES         | now()             | null            | null             | null              |
| chat_sessions  | id               | uuid                     | uuid             | NO          | gen_random_uuid() | PRIMARY KEY     | chat_sessions    | id                |
| chat_sessions  | user_id          | uuid                     | uuid             | YES         | null              | FOREIGN KEY     | profiles         | id                |
| chat_sessions  | document_id      | uuid                     | uuid             | YES         | null              | FOREIGN KEY     | documents        | id                |
| chat_sessions  | title            | text                     | text             | YES         | null              | null            | null             | null              |
| chat_sessions  | created_at       | timestamp with time zone | timestamptz      | YES         | now()             | null            | null             | null              |
| concept_maps   | id               | uuid                     | uuid             | NO          | gen_random_uuid() | PRIMARY KEY     | concept_maps     | id                |
| concept_maps   | user_id          | uuid                     | uuid             | YES         | null              | FOREIGN KEY     | profiles         | id                |
| concept_maps   | document_id      | uuid                     | uuid             | YES         | null              | FOREIGN KEY     | documents        | id                |
| concept_maps   | map_data         | jsonb                    | jsonb            | NO          | '{}'::jsonb       | null            | null             | null              |
| concept_maps   | updated_at       | timestamp with time zone | timestamptz      | YES         | now()             | null            | null             | null              |
| documents      | id               | uuid                     | uuid             | NO          | gen_random_uuid() | PRIMARY KEY     | documents        | id                |
| documents      | title            | text                     | text             | NO          | null              | null            | null             | null              |
| documents      | description      | text                     | text             | YES         | null              | null            | null             | null              |
| documents      | file_url         | text                     | text             | YES         | null              | null            | null             | null              |
| documents      | created_at       | timestamp with time zone | timestamptz      | YES         | now()             | null            | null             | null              |
| notebook_notes | id               | uuid                     | uuid             | NO          | gen_random_uuid() | PRIMARY KEY     | notebook_notes   | id                |
| notebook_notes | user_id          | uuid                     | uuid             | YES         | null              | FOREIGN KEY     | profiles         | id                |
| notebook_notes | document_id      | uuid                     | uuid             | YES         | null              | FOREIGN KEY     | documents        | id                |
| notebook_notes | highlighted_text | text                     | text             | NO          | null              | null            | null             | null              |
| notebook_notes | user_annotations | text                     | text             | YES         | null              | null            | null             | null              |
| notebook_notes | created_at       | timestamp with time zone | timestamptz      | YES         | now()             | null            | null             | null              |
| profiles       | id               | uuid                     | uuid             | NO          | gen_random_uuid() | PRIMARY KEY     | profiles         | id                |
| profiles       | full_name        | text                     | text             | YES         | null              | null            | null             | null              |
| profiles       | grade_group      | USER-DEFINED             | grade_group_type | NO          | null              | null            | null             | null              |
| profiles       | avatar_url       | text                     | text             | YES         | null              | null            | null             | null              |
| profiles       | created_at       | timestamp with time zone | timestamptz      | YES         | now()             | null            | null             | null              |
| profiles       | user_id          | uuid                     | uuid             | NO          | null              | UNIQUE          | profiles         | user_id           |
| profiles       | user_id          | uuid                     | uuid             | NO          | null              | FOREIGN KEY     | null             | null              |
| user_badges    | id               | uuid                     | uuid             | NO          | gen_random_uuid() | PRIMARY KEY     | user_badges      | id                |
| user_badges    | user_id          | uuid                     | uuid             | YES         | null              | FOREIGN KEY     | profiles         | id                |
| user_badges    | badge_id         | uuid                     | uuid             | YES         | null              | FOREIGN KEY     | badges           | id                |
| user_badges    | unlocked_at      | timestamp with time zone | timestamptz      | YES         | now()             | null            | null             | null              |
| user_badges    | progress         | bigint                   | int8             | NO          | '0'::bigint       | null            | null             | null              |
| user_streaks   | user_id          | uuid                     | uuid             | NO          | null              | FOREIGN KEY     | profiles         | id                |
| user_streaks   | current_streak   | integer                  | int4             | YES         | 0                 | null            | null             | null              |
| user_streaks   | longest_streak   | integer                  | int4             | YES         | 0                 | null            | null             | null              |
| user_streaks   | last_active_date | date                     | date             | YES         | CURRENT_DATE      | null            | null             | null              |
| user_streaks   | updated_at       | timestamp with time zone | timestamptz      | YES         | now()             | null            | null             | null              |
| user_streaks   | active_dates     | ARRAY                    | _date            | YES         | null              | null            | null             | null              |
| user_streaks   | id               | uuid                     | uuid             | NO          | gen_random_uuid() | PRIMARY KEY     | user_streaks     | id                |