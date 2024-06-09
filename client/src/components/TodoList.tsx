import { Flex, Spinner, Stack, Text } from "@chakra-ui/react";
import TodoItem from "./TodoItem";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BASE_URL } from "../App";
import { useEffect } from "react";
import { useToastContext } from "../providers/ToastProvider";

export type Todo = {
  id: number;
  body: string;
  completed: boolean;
}

const fetchTodos = async () => {
  const response = await fetch(`${BASE_URL}/todos`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data || [];
}

const TodoList = () => {
  const queryClient = useQueryClient()
  const { addToast } = useToastContext()

  const { data: todos, error, isError, isLoading } = useQuery<Todo[]>({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  });

  useEffect(() => {
    if (isError) {
      addToast('Error', 'error', {
        description: error.message,
      })
    }
  });

  const editTodo = (updatedTodo: Todo) => {
    queryClient.setQueryData(['todos'], (oldTodos: Todo[]) => {
      return oldTodos.map(todo => todo.id === updatedTodo.id ? updatedTodo : todo)
    });
  }

  const removeTodo = (id: number) => {
    queryClient.setQueryData(['todos'], (oldTodos: Todo[]) => {
      return oldTodos.filter(todo => todo.id !== id)
    });
  };

  return (
    <>
      <Text fontSize={"4xl"} textTransform={"uppercase"} fontWeight={"bold"} textAlign={"center"} my={2}
        bgGradient='linear(to-l, #0b85f8, #00ffff)'
        bgClip='text'
      >
        Today's Tasks
      </Text>
      {error && (
        <Text fontSize={"xl"} textAlign={"center"} color={"red.500"}>
          Error: {error.message}
        </Text>
      )}
      {isLoading && (
        <Flex justifyContent={"center"} my={4}>
          <Spinner size={"xl"} />
        </Flex>
      )}
      {!isLoading && todos?.length === 0 && (
        <Stack alignItems={"center"} gap='3'>
          <Text fontSize={"xl"} textAlign={"center"} color={"gray.500"}>
            All tasks completed! 🤞
          </Text>
          <img src='/go.png' alt='Go logo' width={70} height={70} />
        </Stack>
      )}
      <Stack gap={3}>
        {todos?.map((todo) => (
          <TodoItem key={todo.id} todo={todo} removeTodo={removeTodo} editTodo={editTodo} />
        ))}
      </Stack>
    </>
  );
};
export default TodoList;
