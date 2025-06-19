package models


type User struct {
    ID           uuid.UUID `gorm:"type:uuid;primaryKey"`
    Email        string    `gorm:"uniqueIndex;not null"`
    PasswordHash string    `gorm:"not null"`
    CreatedAt    time.Time
}


