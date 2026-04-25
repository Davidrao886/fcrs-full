-- ============================================================
-- SUPABASE ADAPTATION
-- Supabase uses PostgreSQL, not MySQL.
-- This file converts the schema to PostgreSQL syntax.
-- Run this in Supabase SQL Editor.
-- ============================================================

-- Enable UUID extension (optional, we use serial IDs here)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Users" (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('freelancer', 'client')),
    bio             TEXT,
    avatar_url      VARCHAR(255),
    avg_rating      DECIMAL(3,2) DEFAULT 0.00,
    total_reviews   INT DEFAULT 0,
    total_completed INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Projects ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Projects" (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    budget          DECIMAL(10,2),
    client_id       INT NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
    freelancer_id   INT REFERENCES "Users"(id) ON DELETE SET NULL,
    status          VARCHAR(20) DEFAULT 'open'
                    CHECK (status IN ('open','assigned','completed','disputed')),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

-- ── Reviews ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Reviews" (
    id              SERIAL PRIMARY KEY,
    project_id      INT NOT NULL REFERENCES "Projects"(id) ON DELETE CASCADE,
    reviewer_id     INT NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
    reviewee_id     INT NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
    rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (project_id, reviewer_id)
);

-- ── Disputes ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Disputes" (
    id              SERIAL PRIMARY KEY,
    project_id      INT NOT NULL REFERENCES "Projects"(id) ON DELETE CASCADE,
    raised_by       INT NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
    reason          TEXT NOT NULL,
    status          VARCHAR(20) DEFAULT 'open'
                    CHECK (status IN ('open','resolved','closed')),
    resolution      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ,
    UNIQUE (project_id, raised_by)
);

-- ── Trigger: update reputation after review ──────────────────
CREATE OR REPLACE FUNCTION update_user_reputation()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE "Users"
    SET
        avg_rating    = (SELECT AVG(rating)  FROM "Reviews" WHERE reviewee_id = NEW.reviewee_id),
        total_reviews = (SELECT COUNT(*)     FROM "Reviews" WHERE reviewee_id = NEW.reviewee_id)
    WHERE id = NEW.reviewee_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_reputation ON "Reviews";
CREATE TRIGGER trg_update_reputation
AFTER INSERT ON "Reviews"
FOR EACH ROW EXECUTE FUNCTION update_user_reputation();

-- ── Trigger: update completed count ──────────────────────────
CREATE OR REPLACE FUNCTION update_completed_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE "Users" SET total_completed = total_completed + 1 WHERE id = NEW.client_id;
        IF NEW.freelancer_id IS NOT NULL THEN
            UPDATE "Users" SET total_completed = total_completed + 1 WHERE id = NEW.freelancer_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_completed_projects ON "Projects";
CREATE TRIGGER trg_completed_projects
AFTER UPDATE ON "Projects"
FOR EACH ROW EXECUTE FUNCTION update_completed_count();

-- ── Sample data ───────────────────────────────────────────────
INSERT INTO "Users" (name, email, password, role, bio) VALUES
('Alice Johnson', 'alice@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', 'Tech startup founder.'),
('Bob Smith',     'bob@example.com',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'freelancer', 'Full-stack developer.'),
('Carol White',   'carol@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'freelancer', 'UI/UX designer.');

-- Note: password hash above is bcrypt of "password"
-- Change these to real hashes in production!
