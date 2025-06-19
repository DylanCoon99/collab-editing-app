package main

import (
	"os"
	"fmt"
	"log"
	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
	"github.com/joho/godotenv"
	"github.com/DylanCoon99/collab-editing-app/backend/database"
)


func main() {

	err := godotenv.Load(".env")

	if err != nil {
		log.Fatalf("Error loading .env file")
	}


	



}