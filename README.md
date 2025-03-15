# React-Go Tutorial

A simple TODO application built with Golang and React.js.

## Overview

This project demonstrates a full-stack TODO application with:

- **Backend:** Golang using the [Fiber](https://gofiber.io/) framework and [Gorm](https://gorm.io/) ORM with MySQL.
- **Frontend:** A React.js application located in the `client/` directory.

The application supports creating, updating, deleting, and reordering TODO items via a RESTful API.

## Features

- **Create Todo:** Add a new TODO item.
- **Retrieve Todos:** Fetch the list of TODO items.
- **Update Todo:** Modify an existing TODO item.
- **Delete Todo:** Remove a TODO item.
- **Reorder Todos:** Update the order of TODO items.

## Requirements

- **Golang:** Version 1.22.3 or later.
- **MySQL:** A running MySQL database.
- **Node.js & npm/yarn:** For the React frontend.

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/angelo1121/react-go-tutorial.git
cd react-go-tutorial
```

### 2. Backend Setup

1. **Create a `.env` File**

   In the root directory, create a `.env` file with the following content (update the values as needed):

   ```env
   MYSQL_URI="your_mysql_connection_string"
   SERVER_PORT=3000
   ```

2. **Install Go Dependencies**

   Run the following command to download the necessary packages:

   ```bash
   go mod download
   ```

3. **Run Database Migrations and Start the Server**

   The `main.go` file automatically migrates the schema and starts the Fiber server:

   ```bash
   go run main.go
   ```

   The server listens on the port specified in your `.env` file.

### 3. Frontend Setup

1. **Navigate to the Client Directory**

   ```bash
   cd client
   ```

2. **Install Dependencies**

   Use npm (or yarn) to install the required packages:

   ```bash
   npm install
   ```

3. **Start the React Development Server**

   ```bash
   npm run dev
   ```

   The React app will run on its port (usually `5173`) and communicate with the Golang backend.

## API Endpoints

The backend exposes the following endpoints:

- `GET /api/todos`
  Retrieves a list of all TODO items.

- `POST /api/todos`
  Creates a new TODO item.
  **Body Parameters:**
  - `body` (string, required): The content of the TODO item.
  - `completed` (boolean, optional): Completion status (default is `false`).
  - `order` (number, optional): Position/order of the TODO item.

- `PATCH /api/todos/:id`
  Updates an existing TODO item identified by `id`.

- `DELETE /api/todos/:id`
  Deletes a TODO item by `id`.

- `PUT /api/todos/order`
  Updates the order of the TODO items.
  **Body:**
  An array of objects containing the `id` of the TODO item. The order in the array represents the new order.
