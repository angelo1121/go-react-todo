import { Button, Flex, Input, Spinner } from "@chakra-ui/react";
import {MutationFunction, useMutation, useQueryClient} from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import { IoMdAdd, IoMdRefresh } from "react-icons/io";
import { BASE_URL } from "../App";
import { Todo } from "./TodoList";
import { useToastContext } from "../providers/ToastProvider";

const createTodoService: MutationFunction<Todo, string> = async (newTodo: string) => {
  const response = await fetch(`${BASE_URL}/todos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      body: newTodo
    })
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

const TodoForm = () => {
  const queryClient = useQueryClient()
  const { addToast } = useToastContext()

  const [newTodo, setNewTodo] = useState("")
  const [isRefetching, setIsRefetching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const { mutate: createTodo, isPending } = useMutation({
    mutationKey: ["createTodo"],
    mutationFn: createTodoService,
    onSuccess: (data) => {
      queryClient.setQueryData(['todos'], (oldTodos: Todo[]) => [...oldTodos, data]);
      // addTodo(data)
      setNewTodo("")

      if (inputRef.current) {
        inputRef.current.focus();
      }

      addToast('Todo created', 'success', {
        description: data.body
      })
    },
    onError: (error) => {
      console.log(error);
      addToast('Error', 'error', {
        description: error.message,
      })
    }
  })

  const refreshTodos = async () => {
    setIsRefetching(true)

    await queryClient.refetchQueries({
      queryKey: ['todos']
    })

    setIsRefetching(false)

    addToast('Todos refreshed', 'success')

    console.log(queryClient.getQueryData(['todos']))

    const allQueries = queryClient.getQueryCache().findAll();
    allQueries.forEach(query => {
      console.log(`Query Key: ${query.queryKey}`, query.state.data);
    });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTodo(newTodo);
  }

  return (
    <form onSubmit={handleSubmit}>
      <Flex gap={2}>
        <Input
          type='text'
          value={newTodo}
          onChange={e => setNewTodo(e.target.value)}
          ref={inputRef}
        />
        <Button
          ml={2}
          type='submit'
          _active={{
            transform: "scale(.97)",
          }}
        >
          {isPending ? <Spinner size={"xs"} /> : <IoMdAdd size={30} />}
        </Button>
        <Button
          type="button"
          _active={{
            transform: "scale(.97)"
          }}
          onClick={refreshTodos}
        >
          <IoMdRefresh size={30} className={`${isRefetching ? 'rotating' : ''}`} />
        </Button>
      </Flex>
    </form>
  );
};
export default TodoForm;
