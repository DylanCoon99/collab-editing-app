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

	user_uuid := c.Param("user_id")

	user_id, err := uuid.Parse(user_uuid)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse user id."})
		return
	}


	user, err := cfg.DBQueries.GetUserByID(c, user_id)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query database."})
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

	document_uuid := c.Param("document_id")

	document_id, err := uuid.Parse(document_uuid)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse document id."})
		return
	}


	document, err := cfg.DBQueries.GetDocumentByID(c, document_id)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query database."})
		return
	}

	c.JSON(http.StatusOK, document)

}


// get documents for user




// update document





// get document permissions



// remove document permissions



// share documents



