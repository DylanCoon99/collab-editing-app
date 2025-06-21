package main

import (
	"os"
	"fmt"
	"log"
	"time"
	"database/sql"
	_ "github.com/lib/pq"
	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
	"github.com/joho/godotenv"
	"github.com/DylanCoon99/collab-editing-app/backend/internal/database"
	"github.com/DylanCoon99/collab-editing-app/backend/internal/controllers"

)





func main() {

	err := godotenv.Load(".env")

	if err != nil {
		log.Fatalf("Error loading .env file")
	}

	dbURL := os.Getenv("DB_URL")

	db, err := sql.Open("postgres", dbURL)

	if err != nil {
		fmt.Errorf("Failed to start db")
		return
	}

	dbQueries := database.New(db)


	var apiCfg controllers.ApiConfig
	apiCfg.DBQueries = dbQueries



	// gin server setup
	r := gin.Default()

	r.Use(cors.New(cors.Config{
        AllowOrigins:     []string{"http://localhost:8080"},
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
        AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
        ExposeHeaders:    []string{"Content-Length"},
        AllowCredentials: true,
        MaxAge:           12 * time.Hour,
    }))


    api := r.Group("/api")
    {
    	//test endpoint
    	api.GET("/test", controllers.Test)

    	// user endpoints
    	api.POST("/user", apiCfg.CreateUser)

    	// document endpoints
    	api.POST("/document", apiCfg.CreateDocument)
    	api.GET("/document/:document_id", apiCfg.GetDocumentById)

    }


    log.Println("Server starting on port 8080...")

    log.Fatal(r.Run(":8080"))


}