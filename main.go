package main

import (
	"errors"
	"fmt"
	fiberLog "github.com/gofiber/fiber/v2/log"
	"log"
	"os"
	"strings"

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
		log.Fatal(fmt.Errorf("database connection error: %s", err))
	}

	DB = database
}

func GetTodos(c *fiber.Ctx) error {
	var todos []Todo

	if err := DB.WithContext(c.Context()).Order("`order`").Find(&todos).Error; err != nil {
		return fmt.Errorf("get todos error: %s", err)
	}

	return c.Status(fiber.StatusOK).JSON(todos)
}

func CreateTodo(c *fiber.Ctx) error {
	var todo Todo
	if err := c.BodyParser(&todo); err != nil {
		return fmt.Errorf("todo parsing error: %w", err)
	}

	if strings.TrimSpace(todo.Body) == "" {
		return fiber.NewError(fiber.StatusUnprocessableEntity, "Todo body is required.")
	}

	if err := DB.WithContext(c.Context()).Create(&todo).Error; err != nil {
		return fmt.Errorf("store todo error: %w", err)
	}

	return c.Status(fiber.StatusCreated).JSON(todo)
}

func UpdateTodo(c *fiber.Ctx) error {
	id := c.Params("id")

	var todo Todo
	if err := DB.WithContext(c.Context()).First(&todo, id).Error; err != nil {
		return fiber.NewError(fiber.StatusNotFound, "Todo not found.")
	}

	var input map[string]any
	if err := c.BodyParser(&input); err != nil {
		return fmt.Errorf("parsing input error: %w", err)
	}

	if err := DB.WithContext(c.Context()).Model(&todo).Updates(input).Error; err != nil {
		return fmt.Errorf("update todo error: %w", err)
	}

	return c.Status(fiber.StatusOK).JSON(todo)
}

func DeleteTodo(c *fiber.Ctx) error {
	id := c.Params("id")

	var todo Todo
	if err := DB.WithContext(c.Context()).First(&todo, id).Error; err != nil {
		return fiber.NewError(fiber.StatusNotFound, "Todo not found.")
	}

	if err := DB.WithContext(c.Context()).Delete(&todo).Error; err != nil {
		return fmt.Errorf("delete todo error: %w", err)
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"success": true})
}

func UpdateTodosOrder(c *fiber.Ctx) error {
	var input []struct {
		ID uint `json:"id"`
	}

	if err := c.BodyParser(&input); err != nil {
		return fmt.Errorf("parsing input error: %w", err)
	}

	err := DB.
		WithContext(c.Context()).
		Transaction(func(tx *gorm.DB) error {
			for i, v := range input {
				if err := tx.Model(&Todo{}).Where("id = ?", v.ID).Update("order", i+1).Error; err != nil {
					return fmt.Errorf("update todo error: %w", err)
				}
			}
			return nil
		})

	if err != nil {
		return fmt.Errorf("update todos order error: %w", err)
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"success": true})
}

func main() {
	if err := godotenv.Load(".env"); err != nil {
		log.Fatal(fmt.Errorf("error loading .env file: %w", err))
	}

	// Connect to the database
	ConnectDB()

	// Migrate the schema
	//err := DB.AutoMigrate(&Todo{})
	//if err != nil {
	//	log.Fatal(fmt.Errorf("error migrating database: %w", err))
	//}

	// Setup log file
	f, err := os.OpenFile("fiber.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		log.Fatal(fmt.Errorf("error opening log file: %w", err))
	}
	defer f.Close()
	fiberLog.SetOutput(f)

	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			message := "Internal server error"

			var fe *fiber.Error
			if errors.As(err, &fe) {
				if fe.Code != code {
					code = fe.Code
					message = fe.Message
				}
			}

			if code == fiber.StatusInternalServerError {
				fiberLog.Error(err.Error())
			}

			return c.Status(code).JSON(fiber.Map{"message": message})
		},
	})

	app.Use(cors.New(cors.ConfigDefault))

	app.Get("/api/todos", GetTodos)
	app.Post("/api/todos", CreateTodo)
	app.Patch("/api/todos/:id", UpdateTodo)
	app.Delete("/api/todos/:id", DeleteTodo)
	app.Put("/api/todos/order", UpdateTodosOrder)

	log.Fatal(app.Listen(":" + os.Getenv("SERVER_PORT")))
}
