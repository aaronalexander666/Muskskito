package database

import (
    "fmt"
    "os"

    "gorm.io/driver/mysql"
    "gorm.io/gorm"
    "github.com/muskskito/muskskito/models"
)

var DB *gorm.DB

func Connect() {
    dsn := os.Getenv("DATABASE_URL")
    db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
    if err != nil {
        panic("failed to connect to database")
    }

    DB = db
    fmt.Println("Database connected")
}

func Migrate() {
    DB.AutoMigrate(&models.User{}, &models.UserSettings{}, &models.VpnLocation{}, &models.Session{}, &models.Threat{}, &models.ChatMessage{}, &models.Payment{})
    fmt.Println("Database migrated")
}

func GetUserByEmail(email string) (models.User, error) {
    var user models.User
    if err := DB.First(&user, "email = ?", email).Error; err != nil {
        return models.User{}, err
    }
    return user, nil
}

func CreateUser(user models.User) error {
    if err := DB.Create(&user).Error; err != nil {
        return err
    }
    return nil
}
