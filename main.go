package main

import (
	"log"
	"os"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
)

type Todo struct {
	ID        int    `json:"id"`
	Body      string `json:"body"`
	Completed bool   `json:"completed"`
}

var todos = []Todo{}

func GetTodos(c *fiber.Ctx) error {
	return c.Status(200).JSON(todos)
}

func CreateTodo(c *fiber.Ctx) error {
	todo := Todo{}
	if err := c.BodyParser(&todo); err != nil {
		return err
	}

	if todo.Body == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Todo body is required."})
	}

	todo.ID = len(todos) + 1
	todos = append(todos, todo)

	return c.Status(fiber.StatusCreated).JSON(todo)
}

func UpdateTodo(c *fiber.Ctx) error {
	id := c.Params("id")

	for i, todo := range todos {
		if strconv.Itoa(todo.ID) == id {
			todos[i].Completed = !todos[i].Completed
			return c.Status(200).JSON(todos[i])
		}
	}

	return c.Status(404).JSON(fiber.Map{"error": "Todo not found."})
}

func DeleteTodo(c *fiber.Ctx) error {
	id := c.Params("id")

	for i, todo := range todos {
		if strconv.Itoa(todo.ID) == id {
			todos = RemoveIndex(todos, i)
			return c.Status(200).JSON(fiber.Map{"success": true})
		}
	}

	return c.Status(404).JSON(fiber.Map{"error": "Todo not found."})
}

func main() {
	app := fiber.New()

	if err := godotenv.Load(".env"); err != nil {
		log.Fatal("Error loading .env file")
	}

	app.Get("/api/todos", GetTodos)
	app.Post("/api/todos", CreateTodo)
	app.Patch("/api/todos/:id", UpdateTodo)
	app.Delete("/api/todos/:id", DeleteTodo)

	log.Fatal(app.Listen(":" + os.Getenv("SERVER_PORT")))
}

// RemoveIndex removes the element at index i from a slice while maintaining order.
func RemoveIndex[T any](s []T, i int) []T {
	return append(s[:i], s[i+1:]...)
}
