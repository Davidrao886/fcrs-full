-- ============================================================
-- FCRS - Freelancer Credibility & Review System
-- Full MySQL Schema with sample data and queries
-- ============================================================

CREATE DATABASE IF NOT EXISTS fcrs_db;
USE fcrs_db;

-- ============================================================
-- TABLE: Users
-- Stores both freelancers and clients
-- ============================================================
CREATE TABLE IF NOT EXISTS Users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,           -- bcrypt hashed
    role        ENUM('freelancer', 'client') NOT NULL,
    bio         TEXT,
    avatar_url  VARCHAR(255),
    avg_rating  DECIMAL(3,2) DEFAULT 0.00,       -- updated by trigger
    total_reviews  INT DEFAULT 0,                -- updated by trigger
    total_completed INT DEFAULT 0,               -- updated by trigger
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: Projects
-- Clients create projects and assign freelancers
-- ============================================================
CREATE TABLE IF NOT EXISTS Projects (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    budget          DECIMAL(10,2),
    client_id       INT NOT NULL,
    freelancer_id   INT,                         -- nullable until assigned
    status          ENUM('open','assigned','completed','disputed') DEFAULT 'open',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at    TIMESTAMP NULL,

    CONSTRAINT fk_project_client
        FOREIGN KEY (client_id) REFERENCES Users(id) ON DELETE CASCADE,
    CONSTRAINT fk_project_freelancer
        FOREIGN KEY (freelancer_id) REFERENCES Users(id) ON DELETE SET NULL
);

-- ============================================================
-- TABLE: Reviews
-- Both sides review each other after project completion
-- UNIQUE constraint ensures one review per user per project
-- ============================================================
CREATE TABLE IF NOT EXISTS Reviews (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    project_id      INT NOT NULL,
    reviewer_id     INT NOT NULL,               -- who wrote the review
    reviewee_id     INT NOT NULL,               -- who received the review
    rating          TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_review_project
        FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_reviewer
        FOREIGN KEY (reviewer_id) REFERENCES Users(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_reviewee
        FOREIGN KEY (reviewee_id) REFERENCES Users(id) ON DELETE CASCADE,

    -- One review per reviewer per project (prevents duplicate reviews)
    CONSTRAINT uq_one_review_per_project
        UNIQUE (project_id, reviewer_id)
);

-- ============================================================
-- TABLE: Disputes
-- Users can raise disputes for a project
-- ============================================================
CREATE TABLE IF NOT EXISTS Disputes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    project_id  INT NOT NULL,
    raised_by   INT NOT NULL,                   -- user who raised the dispute
    reason      TEXT NOT NULL,
    status      ENUM('open','resolved','closed') DEFAULT 'open',
    resolution  TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,

    CONSTRAINT fk_dispute_project
        FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_dispute_user
        FOREIGN KEY (raised_by) REFERENCES Users(id) ON DELETE CASCADE,

    -- One dispute per user per project
    CONSTRAINT uq_one_dispute_per_project
        UNIQUE (project_id, raised_by)
);

-- ============================================================
-- TRIGGER: After INSERT on Reviews
-- Auto-updates avg_rating and total_reviews on Users table
-- ============================================================
DELIMITER $$

CREATE TRIGGER trg_update_reputation_after_review
AFTER INSERT ON Reviews
FOR EACH ROW
BEGIN
    -- Update the reviewee's average rating and review count
    UPDATE Users
    SET
        avg_rating    = (SELECT AVG(rating) FROM Reviews WHERE reviewee_id = NEW.reviewee_id),
        total_reviews = (SELECT COUNT(*) FROM Reviews WHERE reviewee_id = NEW.reviewee_id)
    WHERE id = NEW.reviewee_id;
END$$

DELIMITER ;

-- ============================================================
-- TRIGGER: After project is marked completed
-- Increment total_completed for both client and freelancer
-- ============================================================
DELIMITER $$

CREATE TRIGGER trg_update_completed_projects
AFTER UPDATE ON Projects
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Increment for client
        UPDATE Users SET total_completed = total_completed + 1
        WHERE id = NEW.client_id;

        -- Increment for freelancer if assigned
        IF NEW.freelancer_id IS NOT NULL THEN
            UPDATE Users SET total_completed = total_completed + 1
            WHERE id = NEW.freelancer_id;
        END IF;
    END IF;
END$$

DELIMITER ;

-- ============================================================
-- SAMPLE DATA
-- ============================================================

-- Insert sample users (passwords are bcrypt of "password123")
INSERT INTO Users (name, email, password, role, bio) VALUES
('Alice Johnson',   'alice@example.com',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client',     'Tech startup founder looking for talented developers.'),
('Bob Smith',       'bob@example.com',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'freelancer',  'Full-stack developer with 5 years experience in React and Node.js.'),
('Carol White',     'carol@example.com',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'freelancer',  'UI/UX designer specializing in mobile-first design.'),
('David Brown',     'david@example.com',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client',     'E-commerce business owner seeking web solutions.'),
('Eva Martinez',    'eva@example.com',     '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'freelancer',  'Backend specialist focused on scalable APIs and databases.');

-- Insert sample projects
INSERT INTO Projects (title, description, budget, client_id, freelancer_id, status, completed_at) VALUES
('Build E-commerce Website',    'Full-stack e-commerce site with cart and payment integration.',   2500.00, 1, 2, 'completed', NOW()),
('Design Mobile App UI',        'UI/UX design for a fitness tracking mobile application.',         800.00,  1, 3, 'completed', NOW()),
('REST API Development',        'Build a RESTful API for inventory management system.',            1200.00, 4, 2, 'completed', NOW()),
('Logo & Brand Identity',       'Create complete brand identity including logo and guidelines.',   400.00,  4, 3, 'assigned',  NULL),
('Database Optimization',       'Optimize slow MySQL queries and improve database performance.',   600.00,  1, 5, 'open',      NULL);

-- Insert sample reviews (only for completed projects)
INSERT INTO Reviews (project_id, reviewer_id, reviewee_id, rating, comment) VALUES
-- Project 1: Alice reviews Bob
(1, 1, 2, 5, 'Bob delivered outstanding work! The website exceeded all expectations. Highly recommend.'),
-- Project 1: Bob reviews Alice
(1, 2, 1, 4, 'Great client, clear requirements and prompt payments. Would work again.'),
-- Project 2: Alice reviews Carol
(2, 1, 3, 5, 'Carol is a design genius. The UI she created is beautiful and intuitive.'),
-- Project 2: Carol reviews Alice
(2, 3, 1, 5, 'Wonderful client to work with. Very clear vision and excellent communication.'),
-- Project 3: David reviews Bob
(3, 4, 2, 4, 'Good work on the API. Minor delays but final product was solid.'),
-- Project 3: Bob reviews David
(3, 2, 4, 3, 'Decent client but requirements changed several times during development.');

-- Insert sample disputes
INSERT INTO Disputes (project_id, raised_by, reason, status) VALUES
(3, 4, 'Freelancer missed the originally agreed deadline by two weeks without prior notice.', 'resolved');

-- ============================================================
-- IMPORTANT QUERIES
-- ============================================================

-- 1. Get full user profile with reputation stats
-- SELECT u.id, u.name, u.role, u.avg_rating, u.total_reviews, u.total_completed, u.bio
-- FROM Users u
-- WHERE u.id = 2;

-- 2. Get all reviews received by a user (JOIN)
-- SELECT r.rating, r.comment, r.created_at,
--        reviewer.name AS reviewer_name,
--        p.title AS project_title
-- FROM Reviews r
-- JOIN Users reviewer ON reviewer.id = r.reviewer_id
-- JOIN Projects p ON p.id = r.project_id
-- WHERE r.reviewee_id = 2
-- ORDER BY r.created_at DESC;

-- 3. Get all projects for a client with freelancer info (JOIN)
-- SELECT p.*, f.name AS freelancer_name, f.avg_rating AS freelancer_rating
-- FROM Projects p
-- LEFT JOIN Users f ON f.id = p.freelancer_id
-- WHERE p.client_id = 1;

-- 4. Top freelancers by average rating (GROUP BY + aggregation)
-- SELECT u.id, u.name, u.avg_rating, u.total_completed,
--        COUNT(r.id) AS review_count
-- FROM Users u
-- LEFT JOIN Reviews r ON r.reviewee_id = u.id
-- WHERE u.role = 'freelancer'
-- GROUP BY u.id
-- ORDER BY u.avg_rating DESC, u.total_completed DESC;

-- 5. Projects with dispute status
-- SELECT p.title, p.status, d.reason, d.status AS dispute_status,
--        raiser.name AS raised_by_name
-- FROM Projects p
-- JOIN Disputes d ON d.project_id = p.id
-- JOIN Users raiser ON raiser.id = d.raised_by;
