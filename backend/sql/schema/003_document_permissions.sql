-- +goose Up
CREATE TABLE document_permissions (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    permission TEXT CHECK (permission IN ('view', 'edit')),
    PRIMARY KEY (user_id, document_id)
);


-- +goose Down
DROP TABLE document_permissions;