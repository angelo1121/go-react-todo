package main

import (
	"log"
	"os"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

type Todo struct {
	ID        uint   `json:"id" gorm:"primarykey"`
	Body      string `json:"body"`
	Completed bool   `json:"completed"`
	Order     uint   `json:"order"`
	// gorm.Model
}

func ConnectDB() {
	dsn := os.Getenv("MYSQL_URI")
	database, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})

	if err != nil {
		log.Fatal("Failed to connect to database", err)
	}

	DB = database
}

func GetTodos(c *fiber.Ctx) error {
	time.Sleep(time.Millisecond * 200)
	// return c.Status(404).JSON(fiber.Map{"error": "Todos not found"})
	var todos []Todo
	DB.Order("`order`").Find(&todos)
	return c.Status(fiber.StatusOK).JSON(todos)
}

func CreateTodo(c *fiber.Ctx) error {
	time.Sleep(time.Millisecond * 150)
	var todo Todo
	if err := c.BodyParser(&todo); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err})
	}

	if strings.TrimSpace(todo.Body) == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Todo body is required."})
	}

	DB.Create(&todo)

	return c.Status(fiber.StatusCreated).JSON(todo)
}

func UpdateTodo(c *fiber.Ctx) error {
	time.Sleep(time.Millisecond * 150)
	id := c.Params("id")

	var todo Todo
	if err := DB.Where("id = ?", id).First(&todo).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Todo not found."})
	}

	var input map[string]any
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err})
	}

	if err := DB.Model(&todo).Updates(input).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": err})
	}

	return c.Status(fiber.StatusOK).JSON(todo)
}

func DeleteTodo(c *fiber.Ctx) error {
	time.Sleep(time.Millisecond * 150)
	id := c.Params("id")

	var todo Todo
	if err := DB.Where("id = ?", id).First(&todo).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Todo not found."})
	}

	if err := DB.Delete(&todo).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"success": true})
}

func UpdateTodosOrder(c *fiber.Ctx) error {
	time.Sleep(time.Millisecond * 1000)

	// return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Failed to update"})

	var input []struct {
		ID uint `json:"id"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err})
	}

	for i, v := range input {
		DB.Model(&Todo{}).Where("id = ?", v.ID).Update("order", i+1)
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"success": true})
}

func main() {
	if err := godotenv.Load(".env"); err != nil {
		log.Fatal("Error loading .env file")
	}

	// Connect to the database
	ConnectDB()

	// Migrate the schema
	DB.AutoMigrate(&Todo{})

	app := fiber.New()

	app.Use(cors.New(cors.ConfigDefault))

	app.Get("/api/todos", GetTodos)
	app.Post("/api/todos", CreateTodo)
	app.Patch("/api/todos/:id", UpdateTodo)
	app.Delete("/api/todos/:id", DeleteTodo)
	app.Put("/api/todos/order", UpdateTodosOrder)

	log.Fatal(app.Listen(":" + os.Getenv("SERVER_PORT")))
}

// RemoveIndex removes the element at index i from a slice while maintaining order.
func RemoveIndex[T any](s []T, i int) []T {
	return append(s[:i], s[i+1:]...)
}
