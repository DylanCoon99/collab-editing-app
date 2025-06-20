package controllers


import (
	"log"
	"net/http"
	//"encoding/json"
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

	// encode the user to a json response


	c.JSON(http.StatusCreated, user)
	return

}


// get user by email



// get user by id
