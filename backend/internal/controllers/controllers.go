package controllers


import (
	"log"
	"net/http"
	//"encoding/json"
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
		Password string `json:password`
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


// get user by email



// get user by id
func (cfg *ApiConfig) GetUserById(c *gin.Context) {

	user_id := c.Param("user_id")

	user_uuid, err := uuid.Parse(user_id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse user id."})
		return
	}


	user, err := cfg.DBQueries.GetUserByID(c, user_uuid)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query database for user."})
		return
	}

	c.JSON(http.StatusOK, user)

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





// get document permissions



// remove document permissions



// share documents



