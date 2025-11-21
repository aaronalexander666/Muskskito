package handlers

import (
    "github.com/gin-contrib/sessions"
    "github.com/gin-contrib/sessions/cookie"
    "github.com/gin-gonic/gin"
    "github.com/muskskito/muskskito/database"
    "github.com/muskskito/muskskito/models"
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
)

func setupTestRouter() *gin.Engine {
    r := gin.Default()
    store := cookie.NewStore([]byte("secret"))
    r.Use(sessions.Sessions("mysession", store))
    return r
}

func setupTestDB() {
    db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
    if err != nil {
        panic("failed to connect database")
    }
    database.DB = db
    database.DB.AutoMigrate(&models.User{}, &models.UserSettings{})
}
