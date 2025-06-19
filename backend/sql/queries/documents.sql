-- name: CreateDocument :one
INSERT INTO documents (title, owner_id, content)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetDocumentByID :one
SELECT * FROM documents
WHERE id = $1;

-- name: GetDocumentsForUser :many
SELECT d.*
FROM documents d
LEFT JOIN document_permissions p ON d.id = p.document_id
WHERE d.owner_id = $1 OR p.user_id = $1;

-- name: UpdateDocumentContent :exec
UPDATE documents
SET content = $2, updated_at = NOW()
WHERE id = $1;
