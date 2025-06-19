-- name: ShareDocument :exec
INSERT INTO document_permissions (user_id, document_id, permission)
VALUES ($1, $2, $3)
ON CONFLICT (user_id, document_id)
DO UPDATE SET permission = EXCLUDED.permission;

-- name: GetDocumentPermission :one
SELECT permission
FROM document_permissions
WHERE user_id = $1 AND document_id = $2;

-- name: RemoveDocumentPermission :exec
DELETE FROM document_permissions
WHERE user_id = $1 AND document_id = $2;
