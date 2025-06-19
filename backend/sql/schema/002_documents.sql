-- +goose Up
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT DEFAULT '', -- OR BYTEA/JSONB for CRDT state
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


-- +goose Down
DROP TABLE documents;