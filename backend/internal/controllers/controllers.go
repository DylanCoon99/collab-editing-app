package controllers


import (
	"log"
	"net/http"
	//"encoding/json"
	"database/sql"
	"github.com/google/uuid"
	"github.com/gin-gonic/gin"
	"github.com/DylanCoon99/collab-editing-app/backend/internal/auth"
	"github.com/DylanCoon99/collab-editing-app/backend/internal/database"
)



type ApiConfig struct {
	DBQueries *database.Queries
}



func Test(c *gin.Context) {

	log.Println("Test endpoint")

	c.JSON(http.StatusOK, gin.H{
      "message": "pong",
    })
    return

} 



// create user
func (cfg *ApiConfig) CreateUser(c *gin.Context) {

	type request struct {
		Password string `json:"password"`
		Email    string `json:"email"`
	}

	var req request


	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Input", "details": err.Error()})
		return
	}

	hashed_password, err := auth.HashPassword(req.Password)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password for new user"})
		return
	}

	email := req.Email

	params := database.CreateUserParams {
		Email:          email,
		PasswordHash: hashed_password,
	}


	user, err := cfg.DBQueries.CreateUser(c, params)
	if err != nil {
		// failed to create user
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}


	c.JSON(http.StatusCreated, user)
	return

}






// create document
func (cfg *ApiConfig) CreateDocument(c *gin.Context) {


	var params database.CreateDocumentParams

	if err := c.ShouldBindJSON(&params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Input", "details": err.Error()})
		return
	}


	document, err := cfg.DBQueries.CreateDocument(c, params)
	if err != nil {
		// failed to create document
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create document"})
		return
	}


	c.JSON(http.StatusCreated, document)
	return

}



// get document by id
func (cfg *ApiConfig) GetDocumentById(c *gin.Context) {

	document_id := c.Param("document_id")

	document_uuid, err := uuid.Parse(document_id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse document id."})
		return
	}


	document, err := cfg.DBQueries.GetDocumentByID(c, document_uuid)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query database for document."})
		return
	}

	c.JSON(http.StatusOK, document)

}



// get documents for user
func (cfg *ApiConfig) GetDocumentForUser(c *gin.Context) {

	user_id := c.Param("user_id")

	user_uuid, err := uuid.Parse(user_id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse document id."})
		return
	}



	user_uuid_nil := uuid.NullUUID {
		UUID: user_uuid,
		Valid: true,
	}


	documents, err := cfg.DBQueries.GetDocumentsForUser(c, user_uuid_nil)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query database for documents."})
		return
	}

	c.JSON(http.StatusOK, documents)

}



// update document

func (cfg *ApiConfig) UpdateDocumentContent(c *gin.Context) {


	type UpdateContentRequest struct {
		Content string `json:"content"`
	}


	var req UpdateContentRequest


	document_id := c.Param("document_id")

	document_uuid, err := uuid.Parse(document_id)


	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse document id."})
		return
	}


	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Input", "details": err.Error()})
		return
	}


	content_struct := sql.NullString {
		String: req.Content,
		Valid: true,
	}


	params := database.UpdateDocumentContentParams {
		ID: document_uuid,
		Content: content_struct,
	}


	cfg.DBQueries.UpdateDocumentContent(c, params)


	c.JSON(http.StatusOK, gin.H{"message": "Successfully updated document content."})

	return
}



// get document permissions
func (cfg *ApiConfig) GetDocumentPermissions(c *gin.Context) {


	/*

		type GetDocumentPermissionParams struct {
		UserID     uuid.UUID
		DocumentID uuid.UUID
	}


	*/



	user_id := c.Query("user_id")
	document_id := c.Query("document_id")

	if document_id == "" || user_id ==  "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID and Document ID query parameters required"})
		return
	}


	user_uuid, err := uuid.Parse(user_id)


	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse user id."})
		return
	}


	document_uuid, err := uuid.Parse(document_id)


	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse document id."})
		return
	}


	params := database.GetDocumentPermissionParams {
		UserID: user_uuid,
		DocumentID: document_uuid,
	}



	permissions, err := cfg.DBQueries.GetDocumentPermission(c, params)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query database for permissions."})
		return
	}

	c.JSON(http.StatusOK, permissions)


}







// remove document permissions
func (cfg *ApiConfig) RemoveDocumentPermissions(c *gin.Context) {


	type RemoveDocumentPermissionsRequest struct {
		UserID string      `json:"user_id"`
		DocumentID string  `json:"document_id"`
	}


	var req RemoveDocumentPermissionsRequest


	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Input", "details": err.Error()})
		return
	}



	user_uuid, err := uuid.Parse(req.UserID)
	document_uuid, err := uuid.Parse(req.DocumentID)

	params := database.RemoveDocumentPermissionParams {
		UserID: user_uuid,
		DocumentID: document_uuid,
	}

	err = cfg.DBQueries.RemoveDocumentPermission(c, params)


	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove permissions from database."})
		return
	}


	c.JSON(http.StatusNoContent, gin.H{"message": "Successfully removed permissions from database."})

	return

}




// share documents
func (cfg *ApiConfig) ShareDocument(c *gin.Context) {

	type ShareDocumentRequest struct {
		UserID string      `json:"user_id"`
		DocumentID string  `json:"document_id"`
		Permission string  `json:"permission"`
	}


	var req ShareDocumentRequest


	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Input", "details": err.Error()})
		return
	}


	user_uuid, err := uuid.Parse(req.UserID)
	document_uuid, err := uuid.Parse(req.DocumentID)


	perm_struct := sql.NullString {
		String: req.Permission,
		Valid: true,
	}



	params := database.ShareDocumentParams {
		UserID: user_uuid,
		DocumentID: document_uuid,
		Permission: perm_struct,
	}

	err = cfg.DBQueries.ShareDocument(c, params)


	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}


	c.JSON(http.StatusCreated, gin.H{"message": "Successfully added permissions from database."})

	return



}



