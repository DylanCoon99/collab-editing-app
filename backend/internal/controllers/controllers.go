package controllers


import (
	"log"
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/DylanCoon99/collab-editing-app/backend/internal/database"
)


func Test(c *gin.Context) {

	log.Println("Test endpoint")

	c.JSON(http.StatusOK, gin.H{
      "message": "pong",
    })
    return

} 




// create user
func CreateUser(c *gin.Context) {


	var newUserParams database.CreateUserParams

	// bind json to user params
	if err := c.ShouldBindJSON(&newUserParams); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Input", "details": err.Error()})
		return
	}

	// call database functionality to create user




}


// get user by email



// get user by id
