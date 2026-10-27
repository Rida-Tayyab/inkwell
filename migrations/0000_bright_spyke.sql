-- Create role enum type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role') THEN
    CREATE TYPE "role" AS ENUM ('viewer', 'editor');
  END IF;
END
$$;

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" text UNIQUE NOT NULL,
  "name" text NOT NULL,
  "password_hash" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create documents table
CREATE TABLE IF NOT EXISTS "documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "owner_id" uuid NOT NULL REFERENCES "users"("id"),
  "title" text NOT NULL DEFAULT 'Untitled document',
  "content" jsonb NOT NULL DEFAULT '{}',
  "version" integer NOT NULL DEFAULT 1,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create document_shares table
CREATE TABLE IF NOT EXISTS "document_shares" (
  "document_id" uuid NOT NULL REFERENCES "documents"("id"),
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "role" "role" NOT NULL DEFAULT 'viewer',
  "created_at" timestamp DEFAULT now() NOT NULL,
  PRIMARY KEY ("document_id", "user_id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_documents_owner_id" ON "documents"("owner_id");
CREATE INDEX IF NOT EXISTS "idx_document_shares_user_id" ON "document_shares"("user_id");
