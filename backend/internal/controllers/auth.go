package controllers


import (
	"log"
	"errors"
	"net/http"
	//"encoding/json"
	//"database/sql"
	//"github.com/google/uuid"
	"github.com/gin-gonic/gin"
	"github.com/DylanCoon99/collab-editing-app/backend/internal/auth"
	"github.com/DylanCoon99/collab-editing-app/backend/internal/database"
	"github.com/DylanCoon99/collab-editing-app/backend/internal/utils"
)





type RegisterLoginInput struct {
	Email string `json"email" binding:"required"`
	Password string `json"password" binding:"required"`
}





func (cfg *ApiConfig) Login(c *gin.Context) {

	var input RegisterLoginInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}


	// We need to verify login
	token, err := cfg.VerifyLogin(input, c)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username or Password is incorrect", "error_message": err.Error()})
		return 
	}

	c.JSON(http.StatusOK, gin.H{"token":token})

}




func (cfg *ApiConfig) VerifyLogin(input RegisterLoginInput, c *gin.Context) (string, error) {


	// get user from database
	user, err := cfg.DBQueries.GetUserByEmail(c, input.Email)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error(), "message": "User by this email not found."})
		return "", errors.New("Email not found.")
	}


	verify := auth.CheckPassword(input.Password, user.PasswordHash)



	if verify != nil {
		return "", errors.New("Username or Password is incorrect")
	}


	token, err := utils.GenerateToken(input.Email)

	log.Printf("%v", err)

	if err != nil {
		return "", err
	}

	return token, nil

}







func (cfg *ApiConfig) Register(c *gin.Context) {

	var input RegisterLoginInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}


	// hash the password
	hashed_password, err := auth.HashPassword(input.Password)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password", "error_message": err.Error()})
		return
	}

	params := database.CreateUserParams {
		Email:          input.Email,
		PasswordHash: hashed_password,
	}


	// insert the user into the database

	user, err := cfg.DBQueries.CreateUser(c, params)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register user.", "error_message": err.Error()})
		return
	}


	c.JSON(http.StatusOK, gin.H{"message": "Successfully registered new user.", "body": user})

}
